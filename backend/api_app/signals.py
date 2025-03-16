from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver
from django_rest_passwordreset.signals import reset_password_token_created

def send_custom_email(subject: str, message: str, recipient: str) -> None:
    """
    Wysyła wiadomość e-mail z określonym tematem, treścią oraz adresem odbiorcy.
    
    Używa ustawień aplikacji (settings) do określenia domyślnego nadawcy wiadomości.
    """
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False,
    )

@receiver(reset_password_token_created)
def handle_reset_password(sender, instance, reset_password_token, **kwargs):
    """
    Obsługuje sygnał resetowania hasła.
    
    Po wygenerowaniu tokena do resetowania hasła, buduje link resetowania i wysyła go na adres e-mail użytkownika.
    """
    reset_link = f"{settings.FRONTEND_URL}/reset-password/confirm?token={reset_password_token.key}"
    message = f"Użyj poniższego linku do resetowania hasła: {reset_link}"
    send_custom_email("Resetowanie hasła", message, reset_password_token.user.email)

@receiver(post_save, sender=User)
def handle_activation_email(sender, instance, created, **kwargs):
    """
    Obsługuje sygnał zapisu nowego użytkownika (post_save).
    
    Po utworzeniu nowego użytkownika generuje token aktywacyjny, buduje link aktywacyjny 
    i wysyła wiadomość e-mail z linkiem do aktywacji konta.
    """
    if created:
        token = default_token_generator.make_token(instance)
        activation_link = f"{settings.FRONTEND_URL}/activate?uid={instance.pk}&token={token}"
        message = f"Aby aktywować konto, kliknij w poniższy link: {activation_link}"
        send_custom_email("Aktywacja konta", message, instance.email)
