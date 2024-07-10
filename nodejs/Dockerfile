FROM node:20

WORKDIR /code/nodejs

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4000

CMD ["node", "app.js"]