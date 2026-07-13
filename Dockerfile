# --- Base Stage ---
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# --- Dependencies Stage ---
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# --- Build Stage ---
FROM base AS builder
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production runner Stage ---
FROM base AS runner
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main"]
