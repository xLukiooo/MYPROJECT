# api_app/validators.py
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class SpecialCharacterValidator:
    def validate(self, password, user=None):
        if not re.search(r'[!@#$%^&*()_+]', password):
            raise ValidationError(
                _("Hasło musi zawierać przynajmniej jeden znak specjalny: !@#$%^&*()_+"),
                code='password_no_special',
            )

    def get_help_text(self):
        return _("Twoje hasło musi zawierać przynajmniej jeden znak specjalny: !@#$%^&*()_+")
