FROM node:20-alpine AS build

WORKDIR /app
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
ENV VITE_API_URL=/api

RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
