from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status
from rest_framework.response import Response
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User

@ensure_csrf_cookie
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrftoken': csrf_token})

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            # Ustawienie tokenów jako ciasteczka
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=data['access'],
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,  
                samesite='Lax', 
            )
            response.set_cookie(
                key=settings.JWT_AUTH_REFRESH_COOKIE,
                value=data['refresh'],
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Lax',
            )
        return response

class RegisterView(APIView):
    permission_classes = [] 
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"id": user.id, "username": user.username}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ActivateAccountView(APIView):
    permission_classes = [] 
    
    def get(self, request):
        uid = request.query_params.get('uid')
        token = request.query_params.get('token')
        
        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response({"error": "Nieprawidłowy użytkownik."}, status=status.HTTP_400_BAD_REQUEST)
        
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({"message": "Konto zostało aktywowane."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Nieprawidłowy token."}, status=status.HTTP_400_BAD_REQUEST)
