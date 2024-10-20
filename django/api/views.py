

# Create your views here.
# api/views.py

from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view


# DUMMY DATA
@api_view(['GET'])
def get_data(request):
    data = [
        {
            "id": "1",
            "title": "Book Review: The Name of the Wind"
        },
        {
            "id": "2",
            "title": "Game Review: Pokemon Brilliant Diamond"
        },
        {
            "id": "3",
            "title": "Show Review: Alice in Borderland"
        }
    ]
    return Response(data)
