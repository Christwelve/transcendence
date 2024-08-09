from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.contrib import messages
from django.contrib.auth.forms import UserCreationForm
from django.views.decorators.csrf import csrf_protect
from .forms import PlayerRegistrationForm

@csrf_protect
def register(request):
    if request.method == 'POST':
        form = PlayerRegistrationForm(request.POST)
        if form.is_valid():
            # Save the user
            form.save()
            email = form.cleaned_data.get('email')
            print(f'Account created for {email}!')
            messages.success(request, f'Account created for {email}!')
            return JsonResponse({'success': True, 'redirect_url': '/login'})
        else:
            errors = form.errors.as_json()
            return JsonResponse({'success': False, 'errors': errors, 'form': form.as_table()})
    else:
        form = PlayerRegistrationForm()
    return render(request, 'skeleton.html', {'form': form})


def skeleton(request):
    form = PlayerRegistrationForm()
    return render(request, 'skeleton.html', {'form': form})

def get_components(request):
    components = {
        'navigation': {
            'parent': 'navigation',
            'html': render_to_string('components/navigation.html')
        },
        'main': {
            'parent': 'content',
            'html': render_to_string('components/main.html')
        },
        'game1': {
            'parent': 'content',
            'html': render_to_string('components/game1.html')
        },
        'game2': {
            'parent': 'content',
            'html': render_to_string('components/game2.html')
        },
        'login': {
            'parent': 'content',
            'html': render_to_string('components/login.html')
        },
        'register': {
            'parent': 'content',
            'html': render_to_string('components/register.html'),
        },
        '404': {
            'parent': 'content',
            'html': render_to_string('components/404.html')
        },
        '500': {
            'parent': 'content',
            'html': render_to_string('components/500.html')
        },
    }

    structure = {
        'main': ['navigation', 'main'],
        'game1': ['navigation', 'game1'],
        'game2': ['navigation', 'game2'],
        'login': ['navigation', 'login'],
        'register': ['navigation', 'register'],
        '404': ['navigation', '404'],
        '500': ['navigation', '500'],
    }

    return JsonResponse({'structure': structure, 'components': components})
