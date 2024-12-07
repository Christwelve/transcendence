import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import User, Match, Statistic
from .serializers import UserSerializer, MatchSerializer, StatisticSerializer
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import get_object_or_404, redirect, render
from django.http import HttpResponseRedirect, JsonResponse

from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['GET'])
def login_with_42(request):
    authorization_url = (
        'https://api.intra.42.fr/oauth/authorize?'
        f'client_id={settings.OAUTH2_PROVIDER["CLIENT_ID"]}'
        '&response_type=code'
        '&redirect_uri=http://localhost:8000/api/42/login/callback/'
        '&scope=public'
    )
    return JsonResponse({'authorization_url': authorization_url})

@csrf_exempt
@api_view(['GET'])
def login_with_42_callback(request):
    if request.method == 'GET':
        # Extract authorization code from the request
        code = request.GET.get('code')
        if not code:
            return JsonResponse({'error': 'Missing authorization code'}, status=400)

        access_token_url = "https://api.intra.42.fr/oauth/token"
        data = {
            'grant_type': 'authorization_code',
            'client_id': settings.OAUTH2_PROVIDER['CLIENT_ID'],
            'client_secret': settings.OAUTH2_PROVIDER['CLIENT_SECRET'],
            'code': code,
            'redirect_uri': 'http://localhost:8000/api/42/login/callback/',
        }

        # post request to get the access token
        token_response = requests.post(access_token_url, data=data)

        # Handle potential errors in the token request
        if not token_response.ok:
            return JsonResponse({'error': 'Failed to obtain access token', 'code': code, 'response': token_response.status_code}, status=token_response.status_code)

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
            return JsonResponse({'error': 'Failed to fetch user information', 'headers': headers, 'status': user_info_response.status_code, 'token_data': token_data}, status=user_info_response.status_code)

        user_info_data = user_info_response.json()

        # Extract relevant user information from the response
        username = user_info_data.get('login')
        email = user_info_data.get('email')
        avatar = user_info_data.get('image')['link']
        password = make_password('')

        userData = {'email': email, 'username': username, 'password': password}

        # Authenticate or create user based on retrieved information
        user = User.objects.filter(username=username).first()
        data = {'user': 'empty'}
        if not user:
            serializer = UserSerializer(data=userData)
            data = {'user': 'serialized'}
            if serializer.is_valid():
                serializer.save()
                data = {'user': 'created'}

        request.session['user_data'] = {
            'username': username,
            'email': email,
            'avatar': avatar,
        }

        return redirect(f"http://localhost:3000?logged_in=true")

    return redirect(f"http://localhost:3000?logged_in=false")

@csrf_exempt
@api_view(['GET'])
def get_user_data(request):
    user_data = request.session.get('user_data', None)
    if not user_data:
        return JsonResponse({'error': 'No user data found', 'session': request.session.get('user_data')}, status=404)
    return JsonResponse(user_data)

@csrf_exempt
@api_view(['POST'])
def login_view(request):
    if request.method == 'POST':
        username = request.data['username']
        password = request.data['password']
        user = get_object_or_404(User, username=username)
        if check_password(password, user.password):
            token, _ = Token.objects.get_or_create(user=user)  # Efficient token retrieval
            serializer = UserSerializer(user)
            request.session['user_data'] = {
                'username': user.username,
                'email': user.email,
            }
            request.session.save()
            return Response({
                'user': serializer.data,
                'token': token.key,  # Include authToken in response
                'user_data': request.session['user_data'],
            }, status=status.HTTP_200_OK)
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
