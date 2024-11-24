from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.user_view, name='user_view'),
	path('users/<str:username>/', views.user_view, name='user_view_by_username'),
    path('matches/', views.match_view, name='match_view'),
    path('statistics/', views.statistic_view, name='statistic_view'),
    path('login/', views.login_view, name='login_view'),
]
