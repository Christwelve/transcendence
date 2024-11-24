import os
import uuid
from django.db import models

def avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    return os.path.join("avatars", unique_filename)

class User(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    email = models.CharField(max_length=255, unique=True)
    status = models.BooleanField(default=True)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    password = models.CharField(max_length=255)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)
    last_online = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"User {self.id}: {self.username}"
    

class Match(models.Model):
    id = models.AutoField(primary_key=True)
    datetime_start = models.DateTimeField() 
    datetime_end = models.DateTimeField()  

    def __str__(self):
        return f"Match {self.id} ({self.datetime_start} - {self.datetime_end})"


class Statistic(models.Model):
    id = models.AutoField(primary_key=True)
    match = models.ForeignKey(
        Match, on_delete=models.CASCADE, related_name="statistics"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="statistics"
    )
    goals_scored = models.PositiveSmallIntegerField(default=0) 
    goals_received = models.PositiveSmallIntegerField(default=0)
    datetime_left = models.DateTimeField() 

    def __str__(self):
        return f"Statistic {self.id}: Match {self.match.id}, User {self.user.username}"
