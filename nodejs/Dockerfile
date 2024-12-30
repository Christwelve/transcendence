FROM node:20.1.0

WORKDIR /code/nodejs

COPY ./package*.json ./
COPY ./src ./
COPY ./certs ./
RUN npm install
RUN ln -s /shared /code/nodejs/node_modules/shared

EXPOSE 4000

CMD [ "npm", "start" ]
