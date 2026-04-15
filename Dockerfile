FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_GOOGLE_CLIENT_ID=""
ARG VITE_API_BASE_URL="/api/v1"

ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine

ENV PORT=10000
ENV NGINX_ENVSUBST_FILTER=PORT|API_GATEWAY_HOSTPORT

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
