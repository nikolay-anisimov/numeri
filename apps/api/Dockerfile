FROM node:20-alpine AS deps
WORKDIR /app
COPY ../../pnpm-workspace.yaml ../../package.json ./
COPY ../../packages ./packages
COPY ./package.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --filter @apps/api...

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
COPY . .
RUN pnpm build && pnpm prisma:generate

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main.js"]

