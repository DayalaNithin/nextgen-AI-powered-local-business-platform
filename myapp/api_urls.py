from django.urls import path

from . import api_views

urlpatterns = [
    # Auth
    path("auth/register", api_views.register, name="api-register"),
    path("auth/login", api_views.login, name="api-login"),
    path("auth/refresh", api_views.refresh_token, name="api-refresh"),
    # Business
    path("business", api_views.business_collection, name="api-business-list"),
    path("business/<uuid:pk>", api_views.business_detail, name="api-business-detail"),
    # Reviews
    path("reviews", api_views.reviews_collection, name="api-reviews-list"),
    path("reviews/<uuid:pk>", api_views.review_detail, name="api-review-detail"),
    # Trends
    path("trends", api_views.trend_collection, name="api-trends-list"),
    path("trends/<uuid:pk>", api_views.trend_detail, name="api-trend-detail"),
    # AI Results
    path("ai-results/<uuid:business_id>", api_views.ai_results, name="api-ai-results"),
    # Dashboard
    path("dashboard/stats", api_views.dashboard_stats, name="api-dashboard-stats"),
    path("dashboard/sentiment", api_views.dashboard_sentiment, name="api-dashboard-sentiment"),
    path("dashboard/trends", api_views.dashboard_trends, name="api-dashboard-trends"),
    path("dashboard/insights", api_views.dashboard_insights, name="api-dashboard-insights"),
    path("dashboard/topic-distribution", api_views.dashboard_topics, name="api-dashboard-topics"),
    path("dashboard/top-praises", api_views.dashboard_top_praises, name="api-dashboard-praises"),
    path("dashboard/top-complaints", api_views.dashboard_top_complaints, name="api-dashboard-complaints"),
    path("dashboard/review-analysis", api_views.dashboard_review_analysis, name="api-dashboard-review-analysis"),
    # Scraper
    path("scraper/run", api_views.run_scraper, name="api-scraper-run"),
]

