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
from rest_framework_simplejwt.tokens import RefreshToken
import qrcode
import io
import base64
import jwt
from rest_framework.exceptions import PermissionDenied

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

@api_view(['POST'])
def enable_2fa(request):
    try:
        if not request.session.get('user_data'):
            return Response({'error': 'User not logged in or session expired'}, status=401)

        username = request.session['user_data'].get('username', None)
        if not username:
            return Response({'error': 'User not logged in or session expired'}, status=401)

        user = get_object_or_404(User, username=username)

        if not request.data:
            return Response({'error': 'No data provided'}, status=400)

        data = request.data
        has_2fa = data.get('has_2fa', False)
        if has_2fa.lower() == 'true':
            has_2fa = True
        elif has_2fa.lower() == 'false':
            has_2fa = False
        user.has_2fa = has_2fa
        user.save()

        return Response({
            'success': 'TwoFactor updated successfully!'
        }, status=200)
    except Exception as e:
        return Response({'message': str(e)}, status=500)


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
        if not token_response.ok:
            return JsonResponse({'error': 'Failed to obtain access token'}, status=token_response.status_code)

        token_data = token_response.json()
        access_token = token_data.get('access_token')
        if not access_token:
            return JsonResponse({'error': 'Missing access token in response'}, status=400)

        user_info_url = 'https://api.intra.42.fr/v2/me'
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)
        if not user_info_response.ok:
            return JsonResponse({'error': 'Failed to fetch user information'}, status=user_info_response.status_code)

        user_info_data = user_info_response.json()

        # Extract user details
        username = user_info_data.get('login')
        email = user_info_data.get('email')
        api_avatar = user_info_data.get('image', {}).get('link', None)
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
        payload = {
                'username': user.username,
                'email': user.email,
                # Add other necessary claims here (e.g., username, roles)
        }
        jwtToken = jwt.encode(
                payload,
                settings.SECRET_KEY,
                algorithm='HS256'
        )

        # # Construct the full avatar URL
        # if user.avatar:
        #     if str(user.avatar).startswith("http"):
        #         avatar_url = str(user.avatar)
        #     else:
        #         avatar_url = f"http://{request.get_host()}{user.avatar.url}"
        # else:
        #     avatar_url = api_avatar if str(api_avatar).startswith("http") else f"http://{request.get_host()}/media/{api_avatar}"

        # Construct the full avatar URL
        if user.avatar and user.avatar.url:
            avatar_url = f"http://{request.get_host()}{user.avatar.url}"
        elif api_avatar and str(api_avatar).startswith("http"):
            avatar_url = api_avatar
        else:
            None



        print("Avatar url:", avatar_url)

        request.session.flush()
        # Store user session data
        request.session['user_data'] = {
            'username': username,
            'email': email,
            'avatar': avatar_url,
            'token': token.key,
            'jwtToken': jwtToken,
        }
        request.session.modified = True
        return redirect(f"http://localhost:3000?logged_in=true")

    return redirect(f"http://localhost:3000?logged_in=false")

@api_view(['GET'])
def get_user_data(request):
    authorization_header = request.headers.get('Authorization')
     # Check for the 'Authorization' header
    if not authorization_header:
        return JsonResponse({'error': 'Authorization header is missing.'}, status=401)

    # Extract the JWT token from the header
    token = request.headers['Authorization'].split(' ')[1]
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=['HS256']  # Adjust algorithm as needed
        )
    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token expired.'}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Invalid token.', 'token': token}, status=401)

    user_data = request.session.get('user_data')
    if not user_data:
        return JsonResponse({'error': 'No user data found', 'session': request.session.get('user_data')}, status=404)
    return JsonResponse(user_data)

@api_view(['GET'])
def validate_token_view(request):
    try:
        user = request.user
        return Response({
            'tid': user.id,
            'username': user.username,
        }, status=200)
    except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=401)



@api_view(['POST'])
def login_view(request):
    if request.method == 'POST':
        username = request.data['username']
        password = request.data['password']
        user = get_object_or_404(User, username=username)
        if check_password(password, user.password):
            if user.has_2fa:
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
            payload = {
                'username': user.username,
                'email': user.email,
                # Add other necessary claims here (e.g., username, roles)
            }
            jwtToken = jwt.encode(
                payload,
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            serializer = UserSerializer(user)

            avatar_url = user.avatar.url if user.avatar else None

            if avatar_url and not avatar_url.startswith("http"):
                avatar_url = f"http://{request.get_host()}{avatar_url}"

            request.session['user_data'] = {
                'username': user.username,
                'email': user.email,
                'avatar': avatar_url,
                'token': token.key,
                'jwtToken': jwtToken,
            }
            request.session.save()

            return Response({
                'user': serializer.data,
                'token': token.key,  # Include authToken in response
                'jwtToken': jwtToken,
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

@api_view(['GET'])
def user_status_view(request):
    try:
        user = request.user
        is_online = True if request.GET.get('status', None) == 'true' else False

        user.status = is_online

        if is_online == False:
            iso_timestamp = now().isoformat()
            user.last_online = iso_timestamp

        user.save()
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({'success': True}, status=status.HTTP_200_OK)

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
        authorization_header = request.headers.get('Authorization')
        # Check for the 'Authorization' header
        if not authorization_header:
            return JsonResponse({'error': 'Authorization header is missing.'}, status=401)

        # Extract the JWT token from the header
        token = request.headers['Authorization'].split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']  # Adjust algorithm as needed
            )
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token.', 'token': token}, status=401)

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
        authorization_header = request.headers.get('Authorization')
        # Check for the 'Authorization' header
        if not authorization_header:
            return JsonResponse({'error': 'Authorization header is missing.'}, status=401)

        # Extract the JWT token from the header
        token = request.headers['Authorization'].split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']  # Adjust algorithm as needed
            )
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token.', 'token': token}, status=401)

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
        authorization_header = request.headers.get('Authorization')
        # Check for the 'Authorization' header
        if not authorization_header:
            return JsonResponse({'error': 'Authorization header is missing.'}, status=401)

        # Extract the JWT token from the header
        token = request.headers['Authorization'].split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']  # Adjust algorithm as needed
            )
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token.', 'token': token}, status=401)

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
        authorization_header = request.headers.get('Authorization')
        # Check for the 'Authorization' header
        if not authorization_header:
            return JsonResponse({'error': 'Authorization header is missing.'}, status=401)

        # Extract the JWT token from the header
        token = request.headers['Authorization'].split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']  # Adjust algorithm as needed
            )
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token.', 'token': token}, status=401)

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

@api_view(['POST'])
def update_profile(request):
    try:
        authorization_header = request.headers.get('Authorization')
        # Check for the 'Authorization' header
        if not authorization_header:
            return JsonResponse({'error': 'Authorization header is missing.'}, status=401)

        # Extract the JWT token from the header
        token = request.headers['Authorization'].split(' ')[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']  # Adjust algorithm as needed
            )
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token expired.'}, status=401)
        except jwt.InvalidTokenError:
            return JsonResponse({'error': 'Invalid token.', 'token': token}, status=401)

        if not request.session.get('user_data'):
            return Response({'error': 'User not logged in or session expired'}, status=401)

        old_username = request.session['user_data'].get('username', None)
        if not old_username:
            return Response({'error': 'User not logged in or session expired'}, status=401)

        user = get_object_or_404(User, username=old_username)

        if not request.data and request.FILES:
            return Response({'message': 'No change made'}, status=200)

        data = request.data
        if 'username' in data:
            new_username = data['username'].strip()
            if new_username and new_username != user.username:
                if User.objects.filter(username=new_username).exists():
                    return Response({'error': 'Username already taken'}, status=400)
                user.username = new_username
                request.session['user_data']['username'] = new_username
                request.session.modified = True

        if 'email' in data:
            new_email = data['email'].strip()
            if not new_email:
                return Response({'error': 'Email cannot be empty'}, status=400)

            if User.objects.filter(email=new_email).exists() and new_email != user.email:
                return Response({'error' : 'Email already in use'}, status=400)

            user.email = new_email

        if 'password' in data:
            user.password = make_password(data['password'])

        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']

        user.save()

        # Construct the full avatar URL
        avatar_url = user.avatar.url if user.avatar else None
        if avatar_url and not avatar_url.startswith("http"):
            avatar_url = f"http://{request.get_host()}{avatar_url}"

        request.session['user_data'] = {
                'username': user.username,
                'email': user.email,
                'avatar': avatar_url,
            }

        return Response({
            'message': 'User updated successfully!',
            'avatar': avatar_url
        }, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)
