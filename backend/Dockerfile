# ==========================================
# Stage 1: Build & Dependency Resolution
# ==========================================
FROM python:3.12-slim-bookworm AS builder

# Copy uv binary directly from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Compile bytecode for faster startup and install into /opt/venv
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /app

# Install dependencies using uv with BuildKit cache and bind mounts (avoids extra layers)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

# ==========================================
# Stage 2: Lean Runtime Image
# ==========================================
FROM python:3.12-slim-bookworm

WORKDIR /app

# Python runtime configuration
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Copy pre-built virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code
COPY . .

# Install entrypoint script globally so host volume mounts don't shadow it
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose FastAPI port
EXPOSE 8000

# Run entrypoint (migrations & directory setup) followed by Uvicorn server with hot reloading
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "/app"]
