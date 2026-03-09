FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY offerings ./offerings

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/bin/api.js"]
