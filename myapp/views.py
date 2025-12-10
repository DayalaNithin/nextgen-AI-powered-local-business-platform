from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie

from .forms import BusinessForm, LoginForm, RegistrationForm
from .models import Business


@ensure_csrf_cookie
def index(request):
    return render(request, "myapp/index.html")


@ensure_csrf_cookie
def login_view(request):
    form = LoginForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        user = form.cleaned_data["user"]
        login(request, user)
        messages.success(request, "Signed in successfully.")
        return redirect("dashboard")

    return render(request, "myapp/login.html", {"form": form})


@ensure_csrf_cookie
def registration_view(request):
    form = RegistrationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, "Account created successfully.")
        return redirect("dashboard")
    return render(request, "myapp/registration.html", {"form": form})


@login_required
@ensure_csrf_cookie
def dashboard(request):
    return render(request, "myapp/dashboard.html")


@login_required
@ensure_csrf_cookie
def business(request):
    form = BusinessForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        business_obj = form.save(commit=False)
        business_obj.owner = request.user
        business_obj.save()
        messages.success(request, "Business saved successfully.")
        return redirect("dashboard")
    return render(request, "myapp/business.html", {"form": form})


@login_required
@ensure_csrf_cookie
def reviews(request):
    businesses = Business.objects.filter(owner=request.user)
    return render(request, "myapp/reviews.html", {"businesses": businesses})


def logout_view(request):
    logout(request)
    return redirect("login")