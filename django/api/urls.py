from django.urls import path, include, re_path
from oauth2_provider import urls as oauth2_urls
from . import views

urlpatterns = [
    path('users/', views.user_view, name='user_view'),
	path('users/<str:username>/', views.user_view, name='user_view_by_username'),
	path('user/data/', views.get_user_data, name='user_data'),
	path('user/status/', views.user_status_view, name='user_status_view'),
    path('matches/', views.match_view, name='match_view'),
    path('statistics/', views.statistic_view, name='statistic_view'),
    path('login/', views.login_view, name='login_view'),
	path('auth/42/login/', views.login_with_42, name='login_with_42'),
    path('42/login/callback/', views.login_with_42_callback, name='login_with_42_callback'),
	path('2fa/generate/', views.setup_2fa, name='2fa_setup'),
	path('logout/', views.logout_view, name='logout_view'),
	path('o/', include(oauth2_urls)),
]

# Friend-related endpoints
urlpatterns += [
    path('friend/', views.fetch_friends, name='fetch_friends'),
    path('user/search/', views.search_users, name='search_users'),
    re_path(r'^api/user/search/?$', views.search_users, name='search_users'),
    path('friend/add/', views.add_friend, name='add_friend'),
    path('friend/remove/', views.remove_friend, name='remove_friend'),
]


# Settings-related endoints
urlpatterns += [
    path('user/update/', views.update_profile, name='update_profile'),
]
