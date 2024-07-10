FROM node:20.1.0

WORKDIR /code/nodejs

COPY ./package*.json ./
RUN npm install
COPY ./src ./

EXPOSE 4000

CMD ["node", "src/app.js"]
