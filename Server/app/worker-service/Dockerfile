FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat
    
COPY package.json package-lock.json ./
RUN npm install --force

COPY . .

RUN npx prisma generate
RUN npx tsc

CMD ["node", "dist/app/worker-service/index.js"]
