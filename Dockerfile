FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache chromium font-noto
WORKDIR /app
ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium-browser
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src ./src
EXPOSE 3000
CMD ["node", "src/server/main.ts"]
