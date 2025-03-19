from django.urls import path, include
from django.contrib import admin

from api_app.views import CustomTokenRefreshView, IsLoggedInView, RegisterView, CustomTokenObtainPairView, ActivateAccountView,LogoutView, ResendActivationView
from api_app.views import get_csrf_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/password_reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/activate/', ActivateAccountView.as_view(), name='activate_account'),
    path('api/get-csrf-token/', get_csrf_token, name='get_csrf_token'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/is-logged-in/', IsLoggedInView.as_view(), name='is_logged_in'),
    path('api/resend-activation/', ResendActivationView.as_view(), name='resend_activation'),
]
