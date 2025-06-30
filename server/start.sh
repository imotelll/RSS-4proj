#!/bin/sh

echo "🚀 Starting SUPRSS Server..."

# Wait for database to be ready with simple pg_isready
echo "⏳ Waiting for database connection..."
until pg_isready -h "${PGHOST:-db}" -p "${PGPORT:-5432}" -U "${PGUSER:-suprss}" -d "${PGDATABASE:-suprssdb}" 2>/dev/null; do
  echo "💤 Database not ready, waiting 2 seconds..."
  sleep 2
done

echo "✅ Database is ready!"

echo "📊 Running database migrations..."
npx drizzle-kit push --verbose

if [ $? -eq 0 ]; then
  echo "✅ Database migrations completed successfully"
else
  echo "❌ Database migrations failed"
  exit 1
fi

echo "🖥️  Starting application server..."
exec npx tsx server/index.ts