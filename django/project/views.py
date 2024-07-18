from django.shortcuts import render
from django.http import JsonResponse
from django.template.loader import render_to_string

def skeleton(request):
    return render(request, 'skeleton.html')

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
            'html': render_to_string('components/register.html')
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
