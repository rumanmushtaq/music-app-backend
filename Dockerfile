# --- deps: install full deps (incl. dev) once, reused by the build stage ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- build: compile TypeScript -> dist using the full deps above ---
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime: lean image with only production deps + compiled output ---
# NODE_ENV is deliberately left unset here (not "production"): this app has no
# TypeORM migrations, so buildDatabaseConfig()'s `synchronize: NODE_ENV !== 'production'`
# is the only thing that ever creates the schema. Setting NODE_ENV=production would
# silently disable it and the app would boot against a schema-less database.
FROM node:22-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
