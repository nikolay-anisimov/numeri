FROM node:20-alpine
WORKDIR /app
COPY ../../pnpm-workspace.yaml ../../package.json ./
COPY ../../packages ./packages
COPY ./package.json ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --filter @services/ocr...
COPY . .
RUN pnpm build
EXPOSE 4100
CMD ["node", "dist/server.js"]

