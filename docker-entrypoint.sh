#!/bin/sh
set -e

# Run Prisma migrations before starting the server
node node_modules/prisma/build/index.js migrate deploy

# Start Next.js standalone server
exec node server.js
