# syntax=docker/dockerfile:1

# ---------- Stage 1: install production dependencies ----------
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Stage 2: minimal runtime image ----------
FROM node:26-alpine
ENV NODE_ENV=production
WORKDIR /app

# Hardening: remove npm, npx, corepack and yarn from the runtime image.
# The app doesn't need them at runtime, and they are a common source of CVEs.
RUN rm -rf /usr/local/lib/node_modules \
           /usr/local/bin/npm /usr/local/bin/npx \
           /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn*

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# Hardening: never run as root
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
