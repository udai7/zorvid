# Build from the repo root: docker build -f packages/worker/Dockerfile .
# The runtime image bundles ffmpeg/ffprobe — the transcoding engine.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/worker/package.json packages/worker/
RUN npm install
COPY packages/shared packages/shared
COPY packages/worker packages/worker
RUN npm run build --workspace @vp/shared && npm run build --workspace @vp/worker

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache ffmpeg
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/worker/package.json packages/worker/
RUN npm install --omit=dev
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/worker/dist packages/worker/dist
CMD ["node", "packages/worker/dist/index.js"]
