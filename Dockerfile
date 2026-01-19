FROM node:20 AS builder
WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 5056

CMD ["node", "dist/server.js"]