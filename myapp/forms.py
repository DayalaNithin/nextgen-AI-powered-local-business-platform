from django import forms
from django.contrib.auth import authenticate, get_user_model

from .models import Business, Review

User = get_user_model()


class RegistrationForm(forms.Form):
    full_name = forms.CharField(max_length=150)
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)

    def clean_email(self):
        email = self.cleaned_data["email"].lower()
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already registered.")
        return email

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("password") != cleaned.get("confirm_password"):
            raise forms.ValidationError("Passwords do not match.")
        return cleaned

    def save(self):
        # Split the provided full name into first and last name when possible.
        full = self.cleaned_data["full_name"].strip()
        parts = full.split(None, 1)
        first = parts[0] if parts else ""
        last = parts[1] if len(parts) > 1 else ""

        user = User.objects.create_user(
            username=self.cleaned_data["email"],
            email=self.cleaned_data["email"],
            password=self.cleaned_data["password"],
            first_name=first,
            last_name=last,
        )
        return user


class LoginForm(forms.Form):
    email = forms.EmailField()
    password = forms.CharField(widget=forms.PasswordInput)
    remember = forms.BooleanField(required=False, initial=False)

    def clean(self):
        cleaned = super().clean()
        email = cleaned.get("email")
        password = cleaned.get("password")
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise forms.ValidationError("Invalid email or password.")
            cleaned["user"] = user
        return cleaned


class BusinessForm(forms.ModelForm):
    class Meta:
        model = Business
        fields = ["name", "category", "location", "google_maps_url"]


class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ["business", "reviewer_name", "rating", "text", "platform", "review_date"]

