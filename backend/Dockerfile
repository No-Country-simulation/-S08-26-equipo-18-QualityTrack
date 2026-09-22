ARG STAGE=production

FROM node:22-alpine AS base
WORKDIR /app
# corepack instala la versión de pnpm fijada en package.json (packageManager).
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Desarrollo
FROM base AS development
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

# Build
FROM base AS build
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Producción
FROM base AS production
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD [ "node", "dist/src/main.js" ]

FROM ${STAGE} AS final
