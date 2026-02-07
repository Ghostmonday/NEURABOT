#!/bin/bash
# Setup PostgreSQL database and user for NEURABOT SOWWY stores
# Run with: sudo -u postgres bash scripts/setup-postgres.sh

set -e

DB_NAME="sowwy"
DB_USER="sowwy"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

echo "Creating PostgreSQL database and user for NEURABOT..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASSWORD"
echo ""

# Create user
psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User $DB_USER already exists"

# Create database
psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database $DB_NAME already exists"

# Grant privileges
psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo ""
echo "✅ PostgreSQL setup complete!"
echo ""
echo "Add these environment variables to ecosystem.config.cjs:"
echo "  SOWWY_POSTGRES_HOST: \"127.0.0.1\","
echo "  SOWWY_POSTGRES_PORT: \"5432\","
echo "  SOWWY_POSTGRES_USER: \"$DB_USER\","
echo "  SOWWY_POSTGRES_PASSWORD: \"$DB_PASSWORD\","
echo "  SOWWY_POSTGRES_DB: \"$DB_NAME\","
echo ""
echo "⚠️  Save the password above - you'll need it for the config!"
