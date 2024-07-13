FROM node:20.1.0

WORKDIR /code/nodejs

COPY ./package*.json ./
COPY ./src ./
RUN npm install

EXPOSE 4000

CMD [ "node", "src/app.js" ]
