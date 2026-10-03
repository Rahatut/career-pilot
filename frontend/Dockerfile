FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY frontend/package.json frontend/pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

COPY frontend/ .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]