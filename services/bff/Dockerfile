FROM node:18-alpine3.17

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --quiet && npm cache clean --force

COPY . .

RUN npm run build

FROM node:18-alpine3.17

WORKDIR /app

COPY --from=0 /app/dist ./dist

ENV PORT=3000

EXPOSE 3000

CMD ["node", "index.js"]
