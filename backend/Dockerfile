
# Specify the Ruby version
FROM ruby:3.2.3

# Install required dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client 

# Set the working directory in the container
WORKDIR /app

# Copy the Gemfile and Gemfile.lock into the container
COPY Gemfile Gemfile.lock ./

# Install gems with Bundler
RUN bundle install

# Copy the rest of the application into the container
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Start the main process
CMD [ "ruby", "main.rb"]

