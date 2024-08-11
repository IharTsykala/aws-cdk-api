FROM node:20-alpine3.17 AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --quiet && npm cache clean --force

COPY . .

RUN npm run build

FROM node:20-alpine3.17

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json ./

RUN npm ci --quiet --only=production && npm cache clean --force

ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
