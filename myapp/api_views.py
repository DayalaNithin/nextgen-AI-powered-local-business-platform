import itertools
import math
import re
from collections import Counter, defaultdict
from datetime import datetime

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Avg, Count, Q
from django.db.models.functions import ExtractMonth
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from . import ai_analysis
from . import scraper

from .auth import build_auth_response, generate_access_token
from .models import AIResult, Business, Review, TrendLog
from .serializers import (
    AIResultSerializer,
    BusinessSerializer,
    ReviewSerializer,
    TrendLogSerializer,
)

User = get_user_model()


def _get_primary_business(user):
    """Return the most recently created business for the user."""
    return Business.objects.filter(owner=user).order_by("-created_at").first()


def _parse_rating(value):
    """Extract an integer rating from mixed inputs."""
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(round(value))
    if isinstance(value, str):
        match = re.search(r"\d+", value)
        if match:
            try:
                return int(match.group())
            except (TypeError, ValueError):
                return 0
    return 0


def _run_ai_pipeline(business, refresh=False):
    """
    Run ai_analysis on the business reviews and persist TrendLog + AIResult.
    When refresh is False and an AIResult already exists, reuse it.
    """
    if not business:
        return None, None

    if not refresh:
        try:
            return None, business.ai_result
        except AIResult.DoesNotExist:
            pass

    reviews_qs = Review.objects.filter(business=business).order_by("-review_date")
    if not reviews_qs.exists():
        return None, None

    review_objects = [
        {"text": r.text or "", "rating": f"{_parse_rating(r.rating)} stars"} for r in reviews_qs
    ]

    trend_log_output, ai_result_output = ai_analysis.analyze_reviews(str(business.id), review_objects)

    TrendLog.objects.update_or_create(
        business=business,
        week=trend_log_output.get("week"),
        month=trend_log_output.get("month"),
        defaults={
            "sentiment_score": trend_log_output.get("sentiment_score"),
            "topic_trends": trend_log_output.get("topic_trends"),
        },
    )

    ai_result, _ = AIResult.objects.update_or_create(
        business=business,
        defaults={
            "sentiment_pos": ai_result_output.get("sentiment_pos"),
            "sentiment_neg": ai_result_output.get("sentiment_neg"),
            "sentiment_neu": ai_result_output.get("sentiment_neu"),
            "top_topics": ai_result_output.get("top_topics"),
            "keywords": ai_result_output.get("keywords"),
            "top_complaints": ai_result_output.get("top_complaints"),
            "top_praises": ai_result_output.get("top_praises"),
            "ai_insights": ai_result_output.get("ai_insights"),
        },
    )

    return trend_log_output, ai_result


# --------------------------
# AUTH ENDPOINTS
# --------------------------


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    email = request.data.get("email", "").lower().strip()
    password = request.data.get("password")
    name = request.data.get("name", "")

    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"detail": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    return Response(build_auth_response(user), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login(request):
    email = request.data.get("email", "").lower().strip()
    password = request.data.get("password")

    user = authenticate(username=email, password=password)
    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

    return Response(build_auth_response(user))


@api_view(["POST"])
def refresh_token(request):
    user = request.user
    return Response({"token": generate_access_token(user), "token_type": "bearer"})


# --------------------------
# BUSINESS
# --------------------------


@api_view(["GET", "POST"])
def business_collection(request):
    if request.method == "GET":
        businesses = Business.objects.filter(Q(owner=request.user) | Q(owner__isnull=True)).order_by("-created_at")
        serializer = BusinessSerializer(businesses, many=True)
        return Response(serializer.data)

    serializer = BusinessSerializer(data=request.data)
    if serializer.is_valid():
        business = serializer.save(owner=request.user)
        return Response(BusinessSerializer(business).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
def business_detail(request, pk):
    try:
        business = Business.objects.get(pk=pk)
    except Business.DoesNotExist:
        return Response({"detail": "Business not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(BusinessSerializer(business).data)

    if request.method == "PUT":
        serializer = BusinessSerializer(business, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    business.delete()
    return Response({"deleted": True})


# --------------------------
# REVIEWS
# --------------------------


@api_view(["GET", "POST"])
def reviews_collection(request):
    if request.method == "GET":
        business_id = request.query_params.get("business_id")
        search_term = request.query_params.get("search")
        sentiment = request.query_params.get("sentiment")

        qs = Review.objects.all().order_by("-review_date")
        if business_id:
            qs = qs.filter(business_id=business_id)
        if search_term:
            qs = qs.filter(Q(text__icontains=search_term) | Q(reviewer_name__icontains=search_term))
        if sentiment:
            if sentiment == "positive":
                qs = qs.filter(rating__gte=4)
            elif sentiment == "negative":
                qs = qs.filter(rating__lte=2)
            elif sentiment == "neutral":
                qs = qs.filter(rating=3)
        total = qs.count()
        serializer = ReviewSerializer(qs, many=True)
        return Response({"reviews": serializer.data, "total": total})

    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        review = serializer.save()
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def review_detail(request, pk):
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response({"detail": "Review not found."}, status=status.HTTP_404_NOT_FOUND)
    review.delete()
    return Response({"deleted": True})


# --------------------------
# TREND LOGS
# --------------------------


@api_view(["GET", "POST"])
def trend_collection(request):
    if request.method == "GET":
        business_id = request.query_params.get("business_id")
        qs = TrendLog.objects.all().order_by("-created_at")
        if business_id:
            qs = qs.filter(business_id=business_id)
        return Response(TrendLogSerializer(qs, many=True).data)

    serializer = TrendLogSerializer(data=request.data)
    if serializer.is_valid():
        log = serializer.save()
        return Response(TrendLogSerializer(log).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def trend_detail(request, pk):
    try:
        log = TrendLog.objects.get(pk=pk)
    except TrendLog.DoesNotExist:
        return Response({"detail": "Trend log not found."}, status=status.HTTP_404_NOT_FOUND)
    log.delete()
    return Response({"deleted": True})


# --------------------------
# AI RESULTS
# --------------------------


@api_view(["GET", "POST"])
def ai_results(request, business_id):
    try:
        business = Business.objects.get(pk=business_id)
    except Business.DoesNotExist:
        return Response({"detail": "Business not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        try:
            ai_result = business.ai_result
        except AIResult.DoesNotExist:
            return Response({"detail": "AI result not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AIResultSerializer(ai_result).data)

    payload = request.data.copy()
    ai_result, _ = AIResult.objects.update_or_create(business=business, defaults=payload)
    return Response(AIResultSerializer(ai_result).data)


# --------------------------
# DASHBOARD
# --------------------------


def _aggregate_keywords(reviews):
    texts = " ".join(filter(None, [r.text or "" for r in reviews]))
    words = [w.lower().strip(".,!?") for w in texts.split() if len(w) > 3]
    return Counter(words).most_common(5)


@api_view(["GET"])
def dashboard_stats(request):
    qs = Review.objects.filter(business__owner=request.user)
    positive = qs.filter(rating__gte=4).count()
    negative = qs.filter(rating__lte=2).count()
    neutral = qs.filter(rating=3).count()
    total = qs.count()
    avg_rating = qs.aggregate(avg=Avg("rating"))["avg"] or 0
    detractors = qs.filter(rating__lte=6).count()
    promoters = qs.filter(rating__gte=9).count()
    nps = round(((promoters - detractors) / total) * 100, 2) if total else 0

    data = {
        "positiveMentions": positive,
        "negativeMentions": negative,
        "neutralMentions": neutral,
        "reviewsCount": total,
        "avgRating": round(avg_rating, 2),
        "nps": nps,
        "avgResponseTime": "N/A",
        "escalations": max(0, negative // 2),
    }
    return Response(data)


@api_view(["GET"])
def dashboard_sentiment(request):
    qs = Review.objects.filter(business__owner=request.user)
    data = {
        "positive": qs.filter(rating__gte=4).count(),
        "negative": qs.filter(rating__lte=2).count(),
        "neutral": qs.filter(rating=3).count(),
        "total": qs.count(),
    }
    return Response(data)


@api_view(["GET"])
def dashboard_trends(request):
    qs = Review.objects.filter(business__owner=request.user)
    grouped = qs.annotate(month=ExtractMonth("review_date")).values("month").annotate(
        avg_rating=Avg("rating"), count=Count("id")
    ).order_by("month")
    data = [
        {
            "month": item["month"],
            "avg_rating": round(item["avg_rating"] or 0, 2),
            "count": item["count"],
        }
        for item in grouped
    ]
    return Response(data)


@api_view(["GET"])
def dashboard_insights(request):
    business = _get_primary_business(request.user)
    refresh = request.query_params.get("refresh") == "1"
    _, ai_result = _run_ai_pipeline(business, refresh=refresh)

    if not business:
        return Response([{"title": "Add a business", "description": "Create a business to generate AI insights."}])

    if not ai_result:
        return Response(
            [{"title": "Add reviews", "description": "Add or import reviews to unlock AI-generated insights."}]
        )

    top_topics = ai_result.top_topics or {}
    keywords = ai_result.keywords or []
    praises = ai_result.top_praises or []
    complaints = ai_result.top_complaints or []

    insights = [
        {
            "title": "AI Summary",
            "description": ai_result.ai_insights or "Insights will appear once reviews are analyzed.",
        }
    ]

    if top_topics:
        sorted_topics = sorted(top_topics.items(), key=lambda item: item[1], reverse=True)
        formatted_topics = ", ".join([f"{label}: {count}" for label, count in sorted_topics[:3]])
        insights.append({"title": "Top Topics", "description": formatted_topics})

    if keywords:
        insights.append({"title": "Keywords", "description": ", ".join(keywords[:5])})

    if praises:
        insights.append({"title": "Praises", "description": "; ".join(praises[:3])})

    if complaints:
        insights.append({"title": "Complaints", "description": "; ".join(complaints[:3])})

    return Response(insights)


@api_view(["GET"])
def dashboard_topics(request):
    business = _get_primary_business(request.user)
    _, ai_result = _run_ai_pipeline(business)

    if ai_result and ai_result.top_topics:
        data = [{"label": label, "value": value} for label, value in ai_result.top_topics.items()]
        return Response({"items": data})

    qs = Review.objects.filter(business__owner=request.user)
    keywords = _aggregate_keywords(qs)
    data = [{"label": word, "value": count} for word, count in keywords]
    return Response({"items": data})


@api_view(["GET"])
def dashboard_top_praises(request):
    business = _get_primary_business(request.user)
    _, ai_result = _run_ai_pipeline(business)

    if ai_result and ai_result.top_praises:
        return Response({"items": ai_result.top_praises})

    qs = Review.objects.filter(business__owner=request.user, rating__gte=4)
    keywords = _aggregate_keywords(qs)
    items = [word for word, _ in keywords]
    return Response({"items": items})


@api_view(["GET"])
def dashboard_top_complaints(request):
    business = _get_primary_business(request.user)
    _, ai_result = _run_ai_pipeline(business)

    if ai_result and ai_result.top_complaints:
        return Response({"items": ai_result.top_complaints})

    qs = Review.objects.filter(business__owner=request.user, rating__lte=2)
    keywords = _aggregate_keywords(qs)
    items = [word for word, _ in keywords]
    return Response({"items": items})


@api_view(["GET"])
def dashboard_review_analysis(request):
    qs = Review.objects.filter(business__owner=request.user)
    by_platform = qs.values("platform").annotate(count=Count("id")).order_by("-count")
    data = [{"platform": item["platform"] or "Unknown", "count": item["count"]} for item in by_platform]
    return Response({"platforms": data, "total": qs.count()})


# --------------------------
# SCRAPER
# --------------------------


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def run_scraper(request):
    url = request.data.get("url")
    business_id = request.data.get("business_id")
    max_scrolls = int(request.data.get("max_scrolls", 2))

    if not url:
        return Response({"detail": "A 'url' is required to scrape reviews."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        reviews, review_meta = scraper.scrape_google_reviews(url, max_scrolls=max_scrolls)
    except Exception as exc:  # pragma: no cover - defensive: selenium may not be installed in test env
        return Response({"detail": f"Scrape failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    business = None
    if business_id:
        try:
            business = Business.objects.get(pk=business_id, owner=request.user)
        except Business.DoesNotExist:
            business = None

    saved_count = 0
    normalized_reviews = []

    for rev in reviews:
        rating_value = _parse_rating(rev.get("rating"))
        normalized_reviews.append(
            {
                "date": str(rev.get("date") or rev.get("date_raw") or timezone.now().date()),
                "source": review_meta.get("Platform") or "Google Maps",
                "rating": rating_value,
                "text": rev.get("text") or "",
                "sentiment": "positive" if rating_value >= 4 else "negative" if rating_value <= 2 else "neutral",
                "topics": [],
            }
        )

        if business:
            Review.objects.create(
                business=business,
                reviewer_name=rev.get("author") or "",
                rating=rating_value or 0,
                text=rev.get("text") or "",
                platform=review_meta.get("Platform") or "Google Maps",
                review_date=timezone.now(),
            )
            saved_count += 1

    return Response({"reviews": normalized_reviews, "meta": review_meta, "saved": saved_count})

