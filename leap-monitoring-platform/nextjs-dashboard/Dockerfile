# Stage 1: Build Next.js
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["npm", "run", "start"]
