FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
RUN ln -s /shared /app/node_modules/shared
COPY . .
EXPOSE 3000
CMD ["npm", "start"]