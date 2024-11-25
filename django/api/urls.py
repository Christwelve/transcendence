from django.urls import path, include
from oauth2_provider import urls as oauth2_urls
from . import views

urlpatterns = [
    path('users/', views.user_view, name='user_view'),
	path('users/<str:username>/', views.user_view, name='user_view_by_username'),
    path('matches/', views.match_view, name='match_view'),
    path('statistics/', views.statistic_view, name='statistic_view'),
    path('login/', views.login_view, name='login_view'),
	path('auth/42/login/', views.login_with_42, name='login_with_42'),
    path('42/login/callback/', views.login_with_42_callback, name='login_with_42_callback'),
	path('o/', include(oauth2_urls)),
]
