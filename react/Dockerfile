# Dockerfile-react


# FROM node:14
# WORKDIR /app
# COPY app/package.json .
# RUN ls -la /app
# RUN npm install
# COPY app/ .
# RUN ls -la /app
# EXPOSE 3000
# CMD ["npm", "start"]


FROM node:14
WORKDIR /app
COPY app/package.json .
RUN npm install
COPY app/ .
EXPOSE 3000
CMD ["npm", "start"]

