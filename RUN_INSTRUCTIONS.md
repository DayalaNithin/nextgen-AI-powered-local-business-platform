# How to Run the Django Application

## Prerequisites

- Python 3.8 or higher
- Virtual environment (recommended)
- Firefox browser (for scraper functionality)

## Step-by-Step Setup

### 1. Navigate to the App Directory

```bash
cd app
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note:** If you encounter issues with `textblob`, you may need to download NLTK data:

```python
python -c "import nltk; nltk.download('punkt'); nltk.download('brown'); nltk.download('movie_reviews')"
```

Or run this Python script:
```python
import nltk
nltk.download('punkt')
nltk.download('brown')
nltk.download('movie_reviews')
```

### 4. Run Database Migrations

```bash
python manage.py migrate
```

### 5. Create a Superuser (Optional - for admin access)

```bash
python manage.py createsuperuser
```

### 6. Start the Development Server

```bash
python manage.py runserver
```

The application will be available at: **http://127.0.0.1:8000/**

## Accessing the Application

- **Home Page:** http://127.0.0.1:8000/
- **Login:** http://127.0.0.1:8000/login/
- **Registration:** http://127.0.0.1:8000/registration/
- **Dashboard:** http://127.0.0.1:8000/dashboard/ (requires login)
- **Business Setup:** http://127.0.0.1:8000/business/ (requires login)
- **Reviews:** http://127.0.0.1:8000/reviews/ (requires login)
- **Admin Panel:** http://127.0.0.1:8000/admin/ (requires superuser)

## API Endpoints

All API endpoints are prefixed with `/api/`:

- **Auth:**
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user
  - `POST /api/auth/refresh` - Refresh token

- **Business:**
  - `GET /api/business` - List businesses
  - `POST /api/business` - Create business
  - `GET /api/business/<id>` - Get business details
  - `PUT /api/business/<id>` - Update business
  - `DELETE /api/business/<id>` - Delete business

- **Reviews:**
  - `GET /api/reviews` - List reviews (supports `?business_id=`, `?search=`, `?sentiment=`)
  - `POST /api/reviews` - Create review

- **Scraper:**
  - `POST /api/scraper/run` - Run scraper (requires: `url`, optional: `business_id`, `max_scrolls`)

- **Dashboard:**
  - `GET /api/dashboard/stats` - Get dashboard statistics
  - `GET /api/dashboard/sentiment` - Get sentiment breakdown
  - `GET /api/dashboard/trends` - Get trend data
  - `GET /api/dashboard/insights` - Get AI insights (supports `?refresh=1` to regenerate)
  - `GET /api/dashboard/topic-distribution` - Get topic distribution
  - `GET /api/dashboard/top-praises` - Get top praises
  - `GET /api/dashboard/top-complaints` - Get top complaints

## Features

### Business Page
- Form with POST method and Submit button
- Create/update business information
- Links to Google Maps URL

### Dashboard
- AI-powered insights from reviews
- Sentiment analysis
- Topic distribution
- Trends and statistics
- Profile menu alignment fixed

### Reviews Page
- View all reviews in a table
- Search and filter reviews
- **Run Scraper** button to scrape Google Reviews
- Displays scraped data

### AI Analysis Integration
- Automatically analyzes reviews when viewing dashboard insights
- Generates sentiment scores, topics, keywords, praises, and complaints
- Results are cached and can be refreshed

### Scraper Integration
- Trigger scraper from Reviews page
- Scrapes Google Maps reviews
- Saves reviews to database if business_id is provided
- Returns normalized review data

## Troubleshooting

### Import Errors
If you see import errors for `ai_analysis` or `scraper`, ensure the files are in `app/myapp/` directory.

### TextBlob Errors
If TextBlob fails, download NLTK data (see step 3).

### Scraper Errors
- Ensure Firefox is installed
- Ensure `selenium` and `swiftshadow` are installed
- Check that the Google Maps URL is valid

### Database Errors
Run migrations: `python manage.py migrate`

### Static Files Not Loading
Collect static files: `python manage.py collectstatic`

## Development Notes

- The application uses SQLite by default (database file: `db.sqlite3`)
- Debug mode is enabled in development
- CSRF protection is enabled
- JWT authentication is available via API

