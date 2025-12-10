import json
from textblob import TextBlob
from collections import Counter
import re
import datetime


# ---------------------------------------------------
# CLEAN TEXT
# ---------------------------------------------------
def clean(text):
    if not text:
        return ""
    return re.sub(r"[^a-zA-Z0-9\s]", "", text.lower())


# ---------------------------------------------------
# SENTIMENT ANALYSIS
# ---------------------------------------------------
def get_sentiment_score(text):
    if not text:
        return 0
    blob = TextBlob(text)
    return blob.sentiment.polarity


def classify_sentiment(score, rating):
    # use rating as stronger signal
    if rating >= 4:
        return "pos"
    if rating <= 2:
        return "neg"

    # fallback to sentiment
    if score > 0.2:
        return "pos"
    elif score < -0.2:
        return "neg"
    return "neu"


# ---------------------------------------------------
# KEYWORD EXTRACTION
# ---------------------------------------------------
def extract_keywords(texts, n=10):
    words = []
    for t in texts:
        if not t:
            continue
        words.extend(clean(t).split())

    cnt = Counter(words)
    return [w for w, _ in cnt.most_common(n)]


# ---------------------------------------------------
# TOPIC EXTRACTION
# ---------------------------------------------------
TOPIC_KEYWORDS = {
    "service": ["service", "staff", "waiter", "attitude", "behaviour"],
    "food": ["food", "taste", "quality", "dish", "tasty"],
    "price": ["price", "expensive", "cheap", "worth"],
    "cleanliness": ["clean", "dirty", "hygiene"],
    "ambience": ["ambience", "atmosphere", "environment", "place"]
}

def extract_topics(texts):
    topic_counts = {topic: 0 for topic in TOPIC_KEYWORDS}

    for t in texts:
        if not t:
            continue
        c = clean(t)
        for topic, words in TOPIC_KEYWORDS.items():
            for w in words:
                if w in c:
                    topic_counts[topic] += 1

    return topic_counts


# ---------------------------------------------------
# COMPLAINTS & PRAISES
# ---------------------------------------------------
positive_words = ["good", "great", "amazing", "awesome", "nice", "love", "excellent"]
negative_words = ["bad", "poor", "terrible", "worst", "dirty", "slow", "expensive"]


def extract_praises(texts):
    results = []
    for t in texts:
        if t and any(w in clean(t) for w in positive_words):
            results.append(t)
    return results[:10]


def extract_complaints(texts):
    results = []
    for t in texts:
        if t and any(w in clean(t) for w in negative_words):
            results.append(t)
    return results[:10]


# ---------------------------------------------------
# AI GENERATED INSIGHTS
# ---------------------------------------------------
def generate_ai_insights(topic_trends, avg_sentiment):
    insights = []

    if avg_sentiment > 0.2:
        insights.append("Overall customer sentiment is positive.")
    elif avg_sentiment < -0.2:
        insights.append("Customer sentiment is negative — major improvements required.")
    else:
        insights.append("Customer sentiment is neutral.")

    # top topic
    top_topic = max(topic_trends, key=lambda k: topic_trends[k])
    if topic_trends[top_topic] > 0:
        insights.append(f"The most discussed topic is '{top_topic}'.")

    return " ".join(insights)


# ---------------------------------------------------
# MAIN PIPELINE (Final Output Matching Django Models)
# ---------------------------------------------------
def analyze_reviews(business_id, review_objects):
    # Extract only text and numeric rating
    texts = []
    ratings = []

    for r in review_objects:
        texts.append(r.get("text"))
        rating_str = r.get("rating", "0 stars")
        rating_num = int(rating_str.split()[0])
        ratings.append(rating_num)

    # SENTIMENT COUNTS
    pos = neg = neu = 0
    sentiment_scores = []

    for text, rating in zip(texts, ratings):
        sc = get_sentiment_score(text)
        sentiment_scores.append(sc)

        sentiment = classify_sentiment(sc, rating)

        if sentiment == "pos": pos += 1
        elif sentiment == "neg": neg += 1
        else: neu += 1

    # AVERAGE SENTIMENT
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)

    # NLP EXTRACTION
    topic_trends = extract_topics(texts)
    keywords = extract_keywords(texts)
    praises = extract_praises(texts)
    complaints = extract_complaints(texts)
    insights = generate_ai_insights(topic_trends, avg_sentiment)

    # TREND LOG OUTPUT
    today = datetime.date.today()
    week = today.isocalendar().week
    month = today.month

    trend_log_output = {
        "business_id": business_id,
        "week": week,
        "month": month,
        "sentiment_score": round(avg_sentiment, 3),
        "topic_trends": topic_trends
    }

    # AI RESULT OUTPUT
    ai_result_output = {
        "business_id": business_id,
        "sentiment_pos": pos,
        "sentiment_neg": neg,
        "sentiment_neu": neu,
        "top_topics": topic_trends,
        "keywords": keywords,
        "top_praises": praises,
        "top_complaints": complaints,
        "ai_insights": insights
    }

    return trend_log_output, ai_result_output



# ---------------------------------------------------
# TEST RUN WITH YOUR SCRAPER FORMAT
# ---------------------------------------------------
if __name__ == "__main__":
    reviews = [] # or paste your list directly

    trend, ai = analyze_reviews(1, reviews)

    print("\n--- TrendLog ---")
    print(json.dumps(trend, indent=4))

    print("\n--- AIResult ---")
    print(json.dumps(ai, indent=4))

