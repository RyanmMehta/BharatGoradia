# Production image used by both Railway and Fly.io.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# SITE_URL is baked into canonical and social links. Railway supplies RAILWAY_PUBLIC_DOMAIN;
# Fly sets SITE_URL in fly.toml. SITE_MODE stays "prototype" until the content is approved.
ARG SITE_URL
ARG RAILWAY_PUBLIC_DOMAIN
ARG SITE_MODE=prototype
ENV NODE_ENV=production SITE_URL=$SITE_URL RAILWAY_PUBLIC_DOMAIN=$RAILWAY_PUBLIC_DOMAIN SITE_MODE=$SITE_MODE
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 ENQUIRY_DB_PATH=/data/enquiries.db
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src/lib/enquiry ./src/lib/enquiry
# Enquiries are stored here. Attach a persistent volume at /data so they survive redeploys.
RUN mkdir -p /data
EXPOSE 8080
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/server/entry.mjs"]
