# Use Playwright's official image — has Chromium + all deps pre-installed
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

# Copy root workspace manifests and lockfile
COPY package*.json ./
COPY turbo.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma/

# Install dependencies across workspaces
RUN npm ci

# Copy shared package source and build it
COPY packages/shared ./packages/shared
RUN npm run build --workspace=@the-offside-trap/shared

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Copy backend source
COPY apps/backend ./apps/backend

# Build backend
RUN npm run build --workspace=backend

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/src/server.js"]
