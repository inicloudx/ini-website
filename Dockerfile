# ---- Stage 1: Builder ----
FROM python:3.13-slim AS builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --prefix=/install -r requirements.txt


# ---- Stage 2: Production ----
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=inixr_site.settings

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy project source
COPY . .

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Create dirs for static/media with correct permissions
RUN mkdir -p /app/staticfiles /app/media && chown -R appuser:appgroup /app

USER appuser

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Gunicorn: 3 workers, timeout 120s
CMD ["gunicorn", "inixr_site.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
