FROM node:20-alpine AS base

# Install OS packages that Prisma/Node commonly rely on
RUN apk add --no-cache openssl git

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies first (leverage Docker layer caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN pnpm prisma:generate

# Copy source and build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
# Compile TypeScript without relying on global Nest CLI
RUN pnpm exec tsc -p tsconfig.build.json

EXPOSE 4000
ENV NODE_ENV=production

# Run the compiled app
CMD ["node", "dist/src/main.js"]