# syntax=docker/dockerfile:1

FROM node:22-alpine3.23 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
    && mkdir -p /runtime-data/log /runtime-data/project

FROM node:22-alpine3.23 AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache su-exec

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /runtime-data ./backend/data
COPY --chown=node:node backend/server.mjs ./backend/server.mjs
COPY --chown=node:node backend/src ./backend/src
COPY --chown=node:node config ./config
COPY --chmod=755 script/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 8787

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "backend/server.mjs"]
