FROM node:18-alpine
WORKDIR /app
COPY react/package.json .
RUN npm install

COPY shared /shared
RUN ln -s /shared /app/node_modules/shared
COPY react .

RUN npm run build
RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
