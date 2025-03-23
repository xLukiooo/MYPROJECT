from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.db.models import Sum
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import Category, Expense
from ..serializers import CategorySerializer, ExpenseSerializer

class CategoryListView(APIView):
    """
    Widok obsługujący listę kategorii.

    Wymaga autoryzacji (IsAuthenticated) oraz jest zabezpieczony przed atakami CSRF (ensure_csrf_cookie).

    GET:
      - Zwraca listę wszystkich kategorii w formacie JSON (pola: id, name).
      - Przeznaczone wyłącznie do odczytu (READ ONLY), nie umożliwia tworzenia/edycji/usuwania kategorii.
      - Zwraca status 200 (OK) w przypadku powodzenia.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_protect, name='dispatch')
class ExpenseListView(APIView):
    """
    Widok obsługujący listę wydatków.

    Wymaga autoryzacji (IsAuthenticated) oraz jest zabezpieczony przed atakami CSRF (ensure_csrf_cookie).

    GET:
      - Zwraca listę wszystkich wydatków zalogowanego użytkownika, posortowaną malejąco po dacie.
      - Pola zwracane w formacie JSON to m.in. id, category (ID kategorii), amount (kwota), date (data).
      - Zwraca status 200 (OK) w przypadku powodzenia.

    POST:
      - Tworzy nowy wydatek i przypisuje go do aktualnie zalogowanego użytkownika.
      - Oczekuje w treści żądania (JSON) pól: category (ID kategorii), amount (kwota), date (data).
      - Jeśli data nie zostanie podana, ustawi dzisiejszą date zgodnie z Serializerem.
      - Walidacja obejmuje m.in. sprawdzenie, czy kwota jest dodatnia i czy data nie jest z przyszłości.
      - Zwraca status 201 (Created) w przypadku powodzenia lub 400 (Bad Request) w razie błędów walidacji.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        expenses = Expense.objects.filter(user=request.user).order_by('-date')
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_protect, name='dispatch')
class ExpenseDetailView(APIView):
    """
    Widok obsługujący pojedynczy wydatek.

    Wymaga autoryzacji (IsAuthenticated) oraz jest zabezpieczony przed atakami CSRF (ensure_csrf_cookie).

    GET:
      - Zwraca szczegóły wybranego wydatku (m.in. id, category, amount, date),
        o ile należy on do zalogowanego użytkownika.
      - Zwraca status 200 (OK) w przypadku powodzenia lub 404 (Not Found), jeśli wydatek nie istnieje.

    PUT:
      - Aktualizuje wydatek częściowo (partial=True), na podstawie przesłanych pól w formacie JSON.
      - Pola możliwe do aktualizacji to m.in. category (ID), amount (kwota), date (data).
      - Walidacja obejmuje m.in. sprawdzenie, czy kwota jest dodatnia i czy data nie jest z przyszłości.
      - Zwraca status 200 (OK) w przypadku powodzenia lub 400 (Bad Request) w razie błędów walidacji,
        oraz 404 (Not Found), jeśli wydatek nie istnieje.

    DELETE:
      - Usuwa wydatek, jeśli należy on do zalogowanego użytkownika.
      - Zwraca status 204 (No Content) w przypadku powodzenia lub 404 (Not Found), jeśli wydatek nie istnieje.
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Expense.objects.get(pk=pk, user=user)
        except Expense.DoesNotExist:
            return None

    def get(self, request, pk):
        expense = self.get_object(pk, request.user)
        if not expense:
            return Response({"error": "Nie znaleziono wydatku."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(expense)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        expense = self.get_object(pk, request.user)
        if not expense:
            return Response({"error": "Nie znaleziono wydatku."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        expense = self.get_object(pk, request.user)
        if not expense:
            return Response({"error": "Nie znaleziono wydatku."}, status=status.HTTP_404_NOT_FOUND)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
