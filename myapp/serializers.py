from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AIResult, Business, Review, TrendLog


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name"]


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["id", "name", "category", "location", "google_maps_url", "created_at", "updated_at"]


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            "id",
            "business",
            "reviewer_name",
            "rating",
            "text",
            "platform",
            "review_date",
            "created_at",
            "updated_at",
        ]


class TrendLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendLog
        fields = ["id", "business", "week", "month", "sentiment_score", "topic_trends", "created_at", "updated_at"]


class AIResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIResult
        fields = [
            "id",
            "business",
            "sentiment_pos",
            "sentiment_neg",
            "sentiment_neu",
            "top_topics",
            "keywords",
            "top_complaints",
            "top_praises",
            "ai_insights",
            "created_at",
            "updated_at",
        ]

