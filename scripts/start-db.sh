#!/bin/bash
echo "Starting PostgreSQL container..."
docker-compose up -d postgres
echo "PostgreSQL is running at localhost:5432"
echo "Waiting for PostgreSQL to be ready..."
sleep 5
echo "Database ready!"