#!/bin/sh
set -e

# Ensure data and uploads directories exist
mkdir -p /app/data /app/uploads

# Run Alembic migrations to bring database up to latest version
echo "==> Running database migrations..."
alembic upgrade head
echo "==> Database migrations completed successfully."

# Execute the main container command
exec "$@"
