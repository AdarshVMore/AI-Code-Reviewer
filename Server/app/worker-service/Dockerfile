FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx tsc

CMD ["node", "dist/app/worker-service/index.js"]
