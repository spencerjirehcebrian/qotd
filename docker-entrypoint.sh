#!/bin/sh
set -e

# Run Prisma migrations before starting the server
npx prisma migrate deploy

# Start Next.js standalone server
exec node server.js
