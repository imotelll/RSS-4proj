#!/bin/sh

echo "🚀 Starting SUPRSS Server..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx tsx -e "
import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => { console.log('Database ready!'); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  echo "💤 Database not ready, waiting 2 seconds..."
  sleep 2
done

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