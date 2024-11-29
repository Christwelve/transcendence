from django.contrib import admin
from .models import Friend


# Register your models here.
@admin.register(Friend)
class FriendAdmin(admin.ModelAdmin):
    list_display = ('user', 'friend', 'created_at')
    search_fields = ('user__username', 'friend__username')