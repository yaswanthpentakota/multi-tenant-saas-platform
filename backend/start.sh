#!/bin/sh
echo "Waiting for database..."
sleep 10
echo "Running migrations..."
node database/migrations/runMigrations.js
echo "Starting server..."
npm start
