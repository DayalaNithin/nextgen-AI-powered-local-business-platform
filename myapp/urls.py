from django.urls import include, path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("registration/", views.registration_view, name="registration"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("business/", views.business, name="business"),
    path("reviews/", views.reviews, name="reviews"),
    path("api/", include("myapp.api_urls")),
]