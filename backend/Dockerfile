ARG STAGE=production

FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# Desarrollo
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"] 

# Build
FROM base AS build
RUN npm ci
COPY . .
RUN npx nest build

# Producción
FROM base AS production
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD [ "node", "dist/src/main.js" ]

FROM ${STAGE} AS final
