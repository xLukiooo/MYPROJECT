from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django_rest_passwordreset.signals import reset_password_token_created

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    email_plaintext_message = (
        f"Użyj poniższego linku do resetowania hasła: "
        f"http://localhost:3000/reset-password/confirm?token={reset_password_token.key}"
    )

    send_mail(
        subject="Resetowanie hasła",
        message=email_plaintext_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[reset_password_token.user.email],
        fail_silently=False,
    )
