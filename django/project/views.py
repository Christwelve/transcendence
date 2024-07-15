from django.shortcuts import render, redirect

def index_view(request):
    return redirect('login')

def login_view(request):
    return render(request, 'login.html')
