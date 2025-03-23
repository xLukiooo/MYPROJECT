from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.permissions import IsAuthenticated

from ..permissions import IsModerator  
from ..serializers import (
    ModeratorUserListSerializer,
    ModeratorUserDetailSerializer
)

class ModeratorUserListView(APIView):
    """
    Widok dla moderatora, umożliwiający wyświetlanie listy użytkowników.

    Wymaga autoryzacji (IsAuthenticated) oraz uprawnień moderatora (IsModerator),
    a także zabezpieczenia przed atakami CSRF (ensure_csrf_cookie).

    GET:
      - Zwraca listę wszystkich użytkowników w formacie JSON, z polami:
        id, first_name, last_name, username.
      - Zwraca status 200 (OK) w przypadku powodzenia.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get(self, request):
        users = User.objects.all().order_by('last_name', 'first_name')
        serializer = ModeratorUserListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

@method_decorator(csrf_protect, name='dispatch')
class ModeratorUserDetailView(APIView):
    """
    Widok dla moderatora, obsługujący szczegóły konkretnego użytkownika.

    Wymaga autoryzacji (IsAuthenticated) oraz uprawnień moderatora (IsModerator),
    a także zabezpieczenia przed atakami CSRF (ensure_csrf_cookie).

    GET:
      - Zwraca szczegóły danego użytkownika (m.in. id, first_name, last_name, username, email),
        lub 404 (Not Found), jeśli użytkownik nie istnieje.
      - Zwraca status 200 (OK) w przypadku powodzenia.

    DELETE:
      - Usuwa danego użytkownika z bazy danych, jeśli istnieje.
      - Zwraca status 204 (No Content) w przypadku powodzenia lub 404 (Not Found), jeśli użytkownik nie istnieje.
    """
    permission_classes = [IsAuthenticated, IsModerator]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj:
            return Response({"error": "Nie znaleziono użytkownika."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ModeratorUserDetailSerializer(user_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user_obj = self.get_object(pk)
        if not user_obj:
            return Response({"error": "Nie znaleziono użytkownika."}, status=status.HTTP_404_NOT_FOUND)
        user_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

