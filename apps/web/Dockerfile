FROM node:20-alpine AS deps
WORKDIR /app
COPY ../../pnpm-workspace.yaml ../../package.json ./
COPY ../../packages ./packages
COPY ./package.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --filter @apps/web...

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "start"]

