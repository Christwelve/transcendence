import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import User, Match, Statistic, Friend, Tournament
from .serializers import UserSerializer, MatchSerializer, StatisticSerializer, FriendSerializer, TournamentSerializer
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import get_object_or_404, redirect
from django.http import JsonResponse
from django.utils.timezone import now

from django.conf import settings
from django_otp.plugins.otp_totp.models import TOTPDevice
import qrcode
import io
import base64

@api_view(['POST'])
def setup_2fa(request):
    username = request.data['username']
    user = get_object_or_404(User, username=username)  # Assuming the user is authenticated

    existing_device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
    confirmed_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
    if existing_device or confirmed_device:
        if confirmed_device:
            device = confirmed_device  # Reuse the existing unconfirmed device
        else:
            device = existing_device
    else:
        # Create a new TOTP device
        device = TOTPDevice.objects.create(user=user, name=username, confirmed=False)

    # Generate a QR code for the TOTP device
    qr_code_data = device.config_url
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_code_data)
    qr.make(fit=True)

    # Convert QR code to an image
    img = io.BytesIO()
    qr.make_image(fill="black", back_color="white").save(img, format="PNG")
    img.seek(0)

    # Encode QR code as Base64
    qr_code_base64 = base64.b64encode(img.getvalue()).decode()

    # Return the QR code as a response
    return Response({
        "qr_code": f"data:image/png;base64,{qr_code_base64}",  # Frontend-friendly QR code
        "manual_entry_key": device.key  # Manual entry key for users without QR code scanning
    }, status=200)

# from api.models import User, Friend

# @csrf_exempt
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

        # Post request to get the access token
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
        password = make_password('')  # Empty password as it is OAuth-based login

        user = User.objects.filter(username=username).first()

        if not user:
            # Create a new user if not exists
            user_data = {'email': email, 'username': username, 'password': password}
            serializer = UserSerializer(data=user_data)
            if serializer.is_valid():
                user = serializer.save()
            else:
                return JsonResponse({'error': 'User creation failed', 'details': serializer.errors}, status=400)

        # Create or retrieve the token for the user
        token, _ = Token.objects.get_or_create(user=user)

        # Store user session data
        request.session['user_data'] = {
            'username': username,
            'email': email,
            'avatar': avatar,
            'token': token.key,
        }

        return redirect(f"http://localhost:3000?logged_in=true")

    return redirect(f"http://localhost:3000?logged_in=false")

@api_view(['GET'])
def get_user_data(request):
    user_data = request.session.get('user_data', None)
    if not user_data:
        return JsonResponse({'error': 'No user data found', 'session': request.session.get('user_data')}, status=404)
    return JsonResponse(user_data)

@api_view(['GET'])
# @authentication_classes([TokenAuthentication])  # Use TokenAuthentication to validate tokens
# @permission_classes([IsAuthenticated])  # Ensure only authenticated users can access
def validate_token_view(request):
    try:
        # Retrieve the user from the authenticated request
        user = request.user
        return Response({
            'tid': user.id,
            'username': user.username,
        }, status=200)
    except AuthenticationFailed:
        return Response({'error': 'Invalid token'}, status=401)


@api_view(['POST'])
def login_view(request):
    if request.method == 'POST':
        username = request.data['username']
        password = request.data['password']
        user = get_object_or_404(User, username=username)
        if check_password(password, user.password):
            totp_device = TOTPDevice.objects.filter(user=user, confirmed=True).first()
            if not totp_device:
                 # Retrieve the unconfirmed TOTP device
                totp_device = TOTPDevice.objects.filter(user=user, confirmed=False).first()
                if not totp_device:
                    return Response({'error': 'No 2FA device found'}, status=status.HTTP_401_UNAUTHORIZED)
                else:
                    totp_device.confirmed = True
                    totp_device.save()

            if totp_device:  # If user has a TOTP device, validate the token
                otp_token = request.data.get('otp_token')
                if not otp_token:  # If no 2FA token is provided, return an error
                    return Response({'error': '2FA token is required'}, status=status.HTTP_401_UNAUTHORIZED)
                if not totp_device.verify_token(otp_token):  # Validate the token
                    return Response({'error': 'Invalid 2FA token'}, status=status.HTTP_401_UNAUTHORIZED)

            token, _ = Token.objects.get_or_create(user=user)  # Efficient token retrieval
            serializer = UserSerializer(user)
            request.session['user_data'] = {
                'username': user.username,
                'email': user.email,
                'avatar': str(user.avatar),
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

@api_view(['PATCH'])
def user_status_view(request):
    user_data = request.session.get('user_data', None)
    status = request.status

    if user_data == NONE:
        return Response({'error': 'Internal Server Error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    user_data['status'] = status

    if status == False:
        iso_timestamp = now().isoformat()
        user_data['last_online'] = iso_timestamp

    serializer = UserSerializer(data=userData)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def match_view(request):
    if request.method == 'GET':
        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = MatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# TODO: GET
@api_view(['POST'])
def statistic_view(request):
    if request.method == 'POST':

        serializer = StatisticSerializer(data=request.data, many=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# TODO: GET
@api_view(['POST'])
def tournament_view(request):
    if request.method == 'POST':

        serializer = TournamentSerializer(data={})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def fetch_friends(request):
    try:
        username = request.session.get('user_data', {}).get('username', None)
        user = get_object_or_404(User, username=username)
        if not user:
            return Response({'error': 'User not found'}, status=404)

        friends = Friend.objects.filter(user=user)
        serializer = FriendSerializer(friends, many=True)
        return Response({'friends': serializer.data}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def search_users(request):
    try:
        query = request.GET.get('query', '').strip()
        if not query:
            return Response({'error': 'Query parameter is required'}, status=400)

        username = request.session.get('user_data', {}).get('username', None)
        user = get_object_or_404(User, username=username)
        users = User.objects.filter(username__icontains=query).exclude(id=user.id)
        friends = Friend.objects.filter(user=user).values_list('friend__id', flat=True)
        users = users.exclude(id__in=friends)

        if not users.exists():
            return Response({'detail': 'No User matches the given query.'}, status=200)

        results = [{'id': user.id, 'username': user.username} for user in users]
        return Response({'users': results}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)



@api_view(['POST'])
def add_friend(request):
    try:
        username = request.session.get('user_data', {}).get('username', None)
        user = get_object_or_404(User, username=username)
        if not user:
            return Response({'error': 'User not found'}, status=404)
        friend_username = request.data.get('username')
        if not friend_username:
            return Response({'error': 'Username is required'}, status=400)
        friend = User.objects.filter(username=friend_username).first()
        if not friend:
            return Response({'error': 'User not found'}, status=404)
        if Friend.objects.filter(user=user, friend=friend).exists():
            return Response({'error': f'{friend_username} is already your friend!'}, status=400)
        Friend.objects.create(user=user, friend=friend)
        return Response({'message': f'{friend_username} added as a friend!'}, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=500)



@api_view(['POST'])
def remove_friend(request):
    try:
        username = request.session.get('user_data', {}).get('username', None)
        user = get_object_or_404(User, username=username)
        if not user:
            return Response({'error': 'User not found'}, status=404)
        friend_username = request.data.get('username')
        if not friend_username:
            return Response({'error': 'Username is required'}, status=400)
        friend = User.objects.filter(username=friend_username).first()
        if not friend:
            return Response({'error': 'User not found'}, status=404)
        friend_relation = Friend.objects.filter(user=user, friend=friend)
        if not friend_relation.exists():
            return Response({'error': f'{friend_username} is not in your friend list!'}, status=400)
        friend_relation.delete()
        return Response({'message': f'{friend_username} removed from your friends!'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def logout_view(request):
    request.session.flush()
    return Response({"message": "Logged out successfully"})
