from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    """
    Reprezentuje kategorię wydatków.

    Atrybuty:
    - name: Nazwa kategorii (maks. 100 znaków), unikalna.
    """
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        """
        Zwraca reprezentację tekstową kategorii.
        """
        return self.name

class Expense(models.Model):
    """
    Reprezentuje pojedynczy wydatek użytkownika.

    Atrybuty:
    - user: Użytkownik, do którego należy wydatek.
    - category: Kategoria wydatku; przy usunięciu kategorii ustawiana na NULL.
    - amount: Kwota wydatku (maks. 10 cyfr, 2 miejsca po przecinku).
    - date: Data wystąpienia wydatku.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        """
        Zwraca reprezentację tekstową wydatku w formacie 'kwota - data'.
        """
        return f"{self.amount} - {self.date}"
