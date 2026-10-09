# Use Playwright's official image — has Chromium + all deps pre-installed
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/server.js"]
