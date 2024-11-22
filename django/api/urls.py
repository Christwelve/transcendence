from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.user_view, name='user_view'),
    path('matches/', views.match_view, name='match_view'),
    path('statistics/', views.statistic_view, name='statistic_view'),
]
