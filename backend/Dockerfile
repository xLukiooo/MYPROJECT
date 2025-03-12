# backend/Dockerfile

FROM python:3.12-slim

# Ustaw zmienną, aby Python nie buforował wyjścia
ENV PYTHONUNBUFFERED=1

# Katalog roboczy wewnątrz kontenera
WORKDIR /app

# Skopiuj plik requirements.txt i zainstaluj zależności
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Skopiuj cały kod aplikacji Django
COPY . /app/

# Otwórz port 8000
EXPOSE 8000

# Domyślne polecenie uruchamiające Gunicorna
CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000"]
