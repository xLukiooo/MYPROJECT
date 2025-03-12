from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(), 
                message="Użytkownik z tym adresem e-mail już istnieje."
            )
        ]
    )
    username = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(), 
                message="Użytkownik o tej nazwie już istnieje."
            )
        ]
    )
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label="Potwierdzenie hasła"
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Hasła muszą się zgadzać."})
        return data

    def create(self, validated_data):
        # Usuń password2, ponieważ nie jest zapisywane w bazie danych
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.is_active = False  # Użytkownik musi aktywować konto przez e-mail
        user.save()

        # Generacja tokena aktywacyjnego oraz wysłanie e-maila aktywacyjnego
        from django.contrib.auth.tokens import default_token_generator
        from django.core.mail import send_mail
        from django.conf import settings

        token = default_token_generator.make_token(user)
        activation_link = f"http://localhost:3000/activate?uid={user.pk}&token={token}"
        send_mail(
            subject="Aktywacja konta",
            message=f"Aby aktywować konto, kliknij w poniższy link: {activation_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return user
