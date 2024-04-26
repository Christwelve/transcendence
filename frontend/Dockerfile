# Use an official Node.js 14 runtime as a base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) into the container
COPY package*.json ./

# Install dependencies in the container
# Also install 'serve' to serve the static build files
RUN npm install
RUN npm install -g serve

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build your app
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app using "serve"
# Serve the content from the build directory on port 3000
CMD ["serve", "-s", "build", "-l", "3000"]
