"""
URL configuration for project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, re_path
from .views import get_components, skeleton

urlpatterns = [
    path('admin/', admin.site.urls),
    path('get_components', get_components, name='get_components'),
    path('', skeleton, name='skeleton'),
    path('game1', skeleton, name='game1'),
    path('game2', skeleton, name='game2'),
    path('login', skeleton, name='login'),
    path('register', skeleton, name='register'),
	path('404', skeleton, name='404'),
	path('500', skeleton, name='500'),
    re_path(r'^.*$', skeleton, name='404'), 
]
