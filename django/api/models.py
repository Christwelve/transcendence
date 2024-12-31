import os
import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin



def avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join("avatars", unique_filename)

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)  # Hash the password
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    status = models.BooleanField(default=True)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    last_online = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # Required by Django
    is_staff = models.BooleanField(default=False)  # Required by Django
    has_2fa = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'  # Field used for authentication
    REQUIRED_FIELDS = ['email']  # Fields required when creating a superuser

    def __str__(self):
        return self.username

class Match(models.Model):
    id = models.AutoField(primary_key=True)
    datetime_start = models.DateTimeField()
    datetime_end = models.DateTimeField()
    tournament_id = models.PositiveIntegerField(null=True)
    premature_end = models.BooleanField(default=False)

    def __str__(self):
        return f"Match {self.id} ({self.datetime_start} - {self.datetime_end}, {self.tournament_id} - {self.premature_end})"


class Statistic(models.Model):
    id = models.AutoField(primary_key=True)
    match_id = models.PositiveIntegerField(null=True)
    user_id = models.PositiveIntegerField(null=True)
    goals_scored = models.PositiveSmallIntegerField(default=0)
    goals_received = models.PositiveSmallIntegerField(default=0)
    datetime_left = models.DateTimeField()

    def __str__(self):
        return f"Statistic {self.id}: Match {self.match_id}, User {self.user_id}"

class Tournament(models.Model):
    id = models.AutoField(primary_key=True)

    def __str__(self):
        return f"Tournament {self.id}"

class Friend(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friends_owner"
    )
    friend = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="friends_friend"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "friend")

    def __str__(self):
        return f"{self.user.username} is friends with {self.friend.username}"
