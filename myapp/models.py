import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Abstract base with UUID PK and audit timestamps."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Business(TimeStampedModel):
    name = models.TextField()
    category = models.TextField(blank=True, null=True)
    location = models.TextField(blank=True, null=True)
    google_maps_url = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="businesses",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return self.name


class Review(TimeStampedModel):
    business = models.ForeignKey(Business, related_name="reviews", on_delete=models.CASCADE)
    reviewer_name = models.TextField(blank=True, null=True)
    rating = models.IntegerField()
    text = models.TextField(blank=True, null=True)
    platform = models.TextField(blank=True, null=True)
    review_date = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return f"{self.business.name} - {self.rating}/5"


class TrendLog(TimeStampedModel):
    business = models.ForeignKey(Business, related_name="trend_logs", on_delete=models.CASCADE)
    week = models.IntegerField(blank=True, null=True)
    month = models.IntegerField(blank=True, null=True)
    sentiment_score = models.FloatField(blank=True, null=True)
    topic_trends = models.JSONField(blank=True, null=True)

    def __str__(self) -> str:
        return f"TrendLog {self.business.name}"


class AIResult(TimeStampedModel):
    business = models.OneToOneField(Business, related_name="ai_result", on_delete=models.CASCADE)
    sentiment_pos = models.IntegerField(blank=True, null=True)
    sentiment_neg = models.IntegerField(blank=True, null=True)
    sentiment_neu = models.IntegerField(blank=True, null=True)
    top_topics = models.JSONField(blank=True, null=True)
    keywords = models.JSONField(blank=True, null=True)
    top_complaints = models.JSONField(blank=True, null=True)
    top_praises = models.JSONField(blank=True, null=True)
    ai_insights = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        return f"AIResult {self.business.name}"

