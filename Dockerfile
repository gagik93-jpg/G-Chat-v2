FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite openssl libssl3

COPY server/package*.json ./
RUN npm cache clean --force
RUN rm -rf node_modules package-lock.json
RUN npm install --omit=dev

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/. .

RUN mkdir -p data uploads uploads/voice logs

EXPOSE 3000 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
