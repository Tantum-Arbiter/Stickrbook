# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements.txt .
COPY requirements-ai.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install AI dependencies (optional - comment out if you don't need Magic Merge)
# RUN pip install --no-cache-dir -r requirements-ai.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data /app/outputs /app/static

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

