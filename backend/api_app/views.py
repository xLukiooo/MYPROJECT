from django.utils import timezone
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import RegisterSerializer

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Zwraca token CSRF w formacie JSON.
    
    Funkcja zabezpiecza widok, ustawiając ciasteczko CSRF w przeglądarce użytkownika, 
    a następnie zwraca token w formacie JSON. Token ten jest wykorzystywany przez 
    front-end do zabezpieczenia żądań przed atakami CSRF.
    """
    csrf_token = get_token(request)
    return JsonResponse({'csrftoken': csrf_token})


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Nadpisanie domyślnego widoku JWT, aby ustawić tokeny w ciasteczkach
    oraz aktualizować datę ostatniego logowania.
    
    Po pomyślnym uwierzytelnieniu:
    - Aktualizuje pole last_login użytkownika.
    - Ustawia ciasteczka z tokenem dostępu (access) oraz tokenem odświeżania (refresh).
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            user = request.user
            if user.is_authenticated:
                user.last_login = timezone.now()
                user.save()
            data = response.data
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=data.get('access'),
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Lax'
            )
            response.set_cookie(
                key=settings.JWT_AUTH_REFRESH_COOKIE,
                value=data.get('refresh'),
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Lax'
            )
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Nadpisanie domyślnego widoku odświeżania tokenu JWT.
    
    Funkcja próbuje pobrać token odświeżania z ciasteczek, a następnie przekazuje go
    do klasy bazowej, która generuje nowy token dostępu (access) oraz nowy token odświeżania.
    Po poprawnym odświeżeniu tokenów, ustawia nowe ciasteczka z tymi tokenami.
    """
    def post(self, request, *args, **kwargs):
        refresh_cookie = request.COOKIES.get(settings.JWT_AUTH_REFRESH_COOKIE)
        if refresh_cookie:
            request.data['refresh'] = refresh_cookie
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            response.set_cookie(
                key=settings.JWT_AUTH_COOKIE,
                value=data.get('access'),
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Lax'
            )
            response.set_cookie(
                key=settings.JWT_AUTH_REFRESH_COOKIE,
                value=data.get('refresh'),
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Lax'
            )
        return response


class RegisterView(APIView):
    """
    Widok rejestracji użytkownika.
    
    Pozwala na utworzenie nowego użytkownika. Dane wejściowe są walidowane
    przy pomocy serializer'a. W przypadku poprawnej walidacji, użytkownik jest zapisywany
    w bazie danych i zwracany jest identyfikator oraz nazwa użytkownika.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"id": user.id, "username": user.username},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActivateAccountView(APIView):
    """
    Widok aktywacji konta na podstawie tokenu wysłanego na e-mail.
    
    Pobiera identyfikator użytkownika (uid) oraz token z parametrów zapytania.
    Weryfikuje, czy użytkownik istnieje i czy token jest prawidłowy.
    W przypadku poprawnej weryfikacji, konto użytkownika zostaje aktywowane.
    """
    permission_classes = []
    
    def get(self, request):
        uid = request.query_params.get('uid')
        token = request.query_params.get('token')
        try:
            user = User.objects.get(pk=uid)
        except User.DoesNotExist:
            return Response(
                {"error": "Nieprawidłowy użytkownik."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response(
                {"message": "Konto zostało aktywowane."},
                status=status.HTTP_200_OK
            )
        return Response(
            {"error": "Nieprawidłowy token."},
            status=status.HTTP_400_BAD_REQUEST
        )


class LogoutView(APIView):
    """
    Widok wylogowania użytkownika przez usunięcie ciasteczek z tokenami.
    
    Metoda POST usuwa ciasteczka przechowujące token dostępu i token odświeżania, 
    co powoduje wylogowanie użytkownika.
    """
    def post(self, request):
        response = Response(
            {"message": "Wylogowano poprawnie"},
            status=status.HTTP_200_OK
        )
        response.delete_cookie(settings.JWT_AUTH_COOKIE)
        response.delete_cookie(settings.JWT_AUTH_REFRESH_COOKIE)
        return response


class IsLoggedInView(APIView):
    """
    Widok sprawdzający, czy użytkownik jest zalogowany.

    Wymaga autoryzacji (IsAuthenticated). Przed wykonaniem widoku następuje weryfikacja tokena JWT,
    który jest pobierany z ciasteczka zgodnie z konfiguracją REST_FRAMEWORK. Jeśli token jest prawidłowy,
    użytkownik jest uwierzytelniony, a widok zwraca odpowiedź JSON z informacją, że użytkownik jest zalogowany.
    W przeciwnym przypadku zwracana jest odpowiedź 401 (Unauthorized).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'isLoggedIn': True})

