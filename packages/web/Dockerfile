# Build the React SPA, then serve it (plus the API/HLS proxy) with nginx.
# Build from the repo root: docker build -f packages/web/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app
COPY packages/web/package.json packages/web/package-lock.json* ./
RUN npm install
COPY packages/web/ ./
# Production SPA calls the API at the same origin under /api (served by nginx).
ENV VITE_API_BASE=/api
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
