FROM node as builder
RUN npm install -g @vue/cli
RUN npm install -g npm@7.20.0
RUN npm i -g @vue/cli-service-global
RUN npm i -g vue@next
RUN npm i -g @vue/compiler-sfc -D
WORKDIR /app
COPY ./package.json /app/
RUN npm install
COPY ./public/ /app/public/
COPY ./babel.config.js /app/
COPY ./.env.development /app/
COPY ./.env.production /app/
COPY ./src/ /app/src/
#WORKDIR /app/src
#RUN vue build
RUN npm run build

FROM nginx:stable as runner
COPY --from=builder /app/dist/ /usr/share/nginx/html/
