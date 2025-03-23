from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.http import base36_to_int
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, AllowAny

from ..serializers import RegisterSerializer
from ..signals import resend_activation_email

@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Zwraca token CSRF w formacie JSON.

    Funkcja zabezpiecza widok, ustawiając ciasteczko CSRF w przeglądarce użytkownika,
    a następnie zwraca token w formacie JSON. Token ten jest wykorzystywany przez front-end
    do zabezpieczenia żądań przed atakami CSRF.
    """
    csrf_token = get_token(request)
    return JsonResponse({'csrftoken': csrf_token})

@method_decorator(csrf_protect, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Nadpisanie domyślnego widoku JWT, aby:
      - Sprawdzić, czy konto użytkownika jest aktywne.
      - Jeśli konto nie jest aktywne, zwrócić komunikat oraz flagę "action": "resend_activation".
      - Jeśli konto jest aktywne, przeprowadzić walidację przez serializer, pobrać użytkownika (serializer.user),
        zaktualizować czas ostatniego logowania, wygenerować tokeny JWT, ustawić ciasteczka i zwrócić odpowiedź.
    """
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        if username:
            try:
                user = User.objects.get(username=username)
                if not user.is_active:
                    return Response(
                        {
                            "error": "Konto nie zostało aktywowane. Proszę aktywować konto lub wyślij ponownie link aktywacyjny.",
                            "action": "resend_activation"
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except User.DoesNotExist:
                pass
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.user
        user.last_login = timezone.now()
        user.save()
        data = serializer.validated_data
        response = Response(data, status=status.HTTP_200_OK)
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

@method_decorator(csrf_protect, name='dispatch')
class CustomTokenRefreshView(TokenRefreshView):
    """
    Nadpisanie domyślnego widoku odświeżania tokenu JWT.

    Funkcja próbuje pobrać token odświeżania z ciasteczek, a następnie przekazuje go do klasy bazowej,
    która generuje nowy token dostępu (access) oraz nowy token odświeżania. Po poprawnym odświeżeniu tokenów,
    ustawiane są nowe ciasteczka z tymi tokenami.
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

@method_decorator(csrf_protect, name='dispatch')
class RegisterView(APIView):
    """
    Widok rejestracji użytkownika.

    Pozwala na utworzenie nowego użytkownika. Dane wejściowe są walidowane przy pomocy serializer'a.
    W przypadku poprawnej walidacji, użytkownik jest zapisywany w bazie danych i zwracany jest identyfikator
    oraz nazwa użytkownika.
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
    Widok aktywacji konta.

    Pobiera uid i token z parametrów zapytania. Jeśli token jest poprawny, konto zostaje aktywowane.
    W przeciwnym razie, jeśli token przekroczył ustawiony limit czasu, zwracany jest komunikat o wygaśnięciu.
    """
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
            try:
                ts_b36, _ = token.split("-")
                ts = base36_to_int(ts_b36)
            except Exception:
                return Response({"error": "Nieprawidłowy token."}, status=status.HTTP_400_BAD_REQUEST)
            current_ts = default_token_generator._num_seconds(default_token_generator._now())
            token_age = current_ts - ts
            if token_age > settings.PASSWORD_RESET_TIMEOUT:
                return Response(
                    {"error": "Token wygasł. Proszę o ponowne wysłanie linku aktywacyjnego."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response({"error": "Nieprawidłowy token."}, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_protect, name='dispatch')
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
    Widok sprawdzający, czy użytkownik jest zalogowany oraz czy posiada rolę moderatora.

    Wymaga autoryzacji (IsAuthenticated). Przed wykonaniem widoku następuje weryfikacja tokena JWT,
    który jest pobierany z ciasteczka zgodnie z konfiguracją REST_FRAMEWORK.
    Jeśli token jest prawidłowy, użytkownik jest uwierzytelniony, a widok zwraca odpowiedź JSON z informacjami:
      - 'isLoggedIn': True
      - 'isModerator': True, jeśli użytkownik należy do grupy 'Moderator', w przeciwnym razie False.
    W przypadku braku autoryzacji zwracany jest status 401.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        is_moderator = user.groups.filter(name='Moderator').exists()
        return Response({'isLoggedIn': True, 'isModerator': is_moderator})

@method_decorator(csrf_protect, name='dispatch')
class ResendActivationView(APIView):
    """
    Widok umożliwiający ponowne wysłanie linku aktywacyjnego.

    Przyjmuje nazwę użytkownika, sprawdza, czy użytkownik istnieje oraz czy konto nie jest aktywne,
    a następnie wywołuje sygnał resend_activation_email, który generuje nowy token aktywacyjny i wysyła
    wiadomość e-mail. Backend automatycznie pobiera adres e-mail powiązany z kontem użytkownika.
    """
    permission_classes = []

    def post(self, request):
        username = request.data.get("username")
        if not username:
            return Response({"error": "Nazwa użytkownika jest wymagana."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "Użytkownik z podaną nazwą nie istnieje."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.is_active:
            return Response({"error": "Konto jest już aktywne."}, status=status.HTTP_400_BAD_REQUEST)
        
        resend_activation_email.send(sender=self.__class__, user=user)
        
        return Response({"message": "Nowy link aktywacyjny został wysłany."}, status=status.HTTP_200_OK)
