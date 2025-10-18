#!/bin/sh

echo "🚀 Starting Multi-Variant E-commerce System"
echo "==========================================="

# Generate Prisma client if needed
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Seed database if SEED_DATABASE env var is set
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database with test data..."
    npx prisma db seed || echo "⚠️ Seeding failed or already complete"
fi

echo "✅ Database setup complete"
echo "🌐 Starting Next.js application..."

# Start the application
exec node server.js