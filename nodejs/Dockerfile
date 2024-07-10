FROM node:20.1.0

WORKDIR /code/nodejs

COPY package*.json ./
COPY setup.sh ./
COPY ./src ./

RUN chmod +x /code/nodejs/setup.sh

EXPOSE 4000

# CMD ["node", "app.js"]
ENTRYPOINT [ "./setup.sh" ]