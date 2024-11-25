import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import User, Match, Statistic
from .serializers import UserSerializer, MatchSerializer, StatisticSerializer
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import authenticate, login
from django.shortcuts import get_object_or_404, redirect
from django.http import HttpResponseRedirect, JsonResponse

from django.conf import settings

@api_view(['GET'])
def login_with_42(request):
    if request.method == 'GET':
        return HttpResponseRedirect(settings.URL_42)


@api_view(['GET'])
def login_with_42_callback(request):
    if request.method == 'GET':
        # Extract authorization code from the request
        code = request.GET.get('code')
        if not code:
            return JsonResponse({'error': 'Missing authorization code'}, status=400)

        # Request access token using the authorization code
        token_url = f'https://api.intra.42.fr/oauth/token'
        token_data = {
            'grant_type': 'authorization_code',
            'client_id': settings.SOCIAL_AUTH_INTRAFRA_KEY,
            'client_secret': settings.SOCIAL_AUTH_INTRAFRA_SECRET,  # Replace with your 42 client secret
            'redirect_uri': settings.URL_42,
            'code': code,
        }
        token_response = requests.get(token_url, data=token_data)

        # Handle potential errors in the token request
        if not token_response.ok:
            return JsonResponse({'error': 'Failed to obtain access token'}, status=token_response.status_code)

        token_data = token_response.json()
        access_token = token_data.get('access_token')
        if not access_token:
            return JsonResponse({'error': 'Missing access token in response'}, status=400)

        # Use access token to fetch user information from the 42 API
        user_info_url = f'https://api.intra.42.fr/v2/me'
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)

        # Handle potential errors in fetching user information
        if not user_info_response.ok:
            return JsonResponse({'error': 'Failed to fetch user information'}, status=user_info_response.status_code)

        user_info_data = user_info_response.json()

        # Extract relevant user information from the response
        username = user_info_data.get('email')
        email = user_info_data.get('email')
        avatar = user_info_data.get('image')['link']

        # Authenticate or create user based on retrieved information
        user = authenticate(username=username, email=email)
        if user:
            login(request, user)
            # Access the session object to create a session ID (if needed)
            session = request.session
            session_id = session.session_key  # Access the session key
            response_data = {'message': 'Login successful', 'session_id': session_id}
        else:
            # Create a new user if necessary (implement user creation logic)
            # ...
            response_data = {'message': 'User created and logged in'}

        return JsonResponse(response_data, status=status.HTTP_200_OK)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


@api_view(['POST'])
def login_view(request):
    if request.method == 'POST':
        username = request.data['username']
        password = request.data['password']
        user = get_object_or_404(User, username=username)
        if check_password(password, user.password):
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
def user_view(request, username=None):
    if request.method == 'GET':
        if username:
            user = get_object_or_404(User, username=username)
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            users = User.objects.all()
            print(request)
            serializer = UserSerializer(users, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        userData = request.data.copy()
        userData['password'] = make_password(userData['password'])
        serializer = UserSerializer(data=userData)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def match_view(request):
    if request.method == 'GET':
        matches = Match.objects.all()
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = MatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def statistic_view(request):
    if request.method == 'GET':
        statistics = Statistic.objects.all()
        serializer = StatisticSerializer(statistics, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = StatisticSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
