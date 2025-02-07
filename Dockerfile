FROM node:16-buster-slim as react-build
WORKDIR app

COPY ./package.json /app/package.json

RUN apt-get update && apt-get -y install git

COPY ./yarn.lock /app/yarn.lock
RUN yarn install
COPY ./src /app/src

COPY ./.env /app/.env
COPY ./tsconfig.json /app/tsconfig.json
COPY ./server.js /app/server.js
COPY ./index.html /app/index.html
COPY ./vite.config.ts /app/vite.config.ts

RUN  yarn run build
EXPOSE 80
ENV PORT 80

CMD npm run serve
