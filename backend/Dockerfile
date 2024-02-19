
# Use an official Ruby runtime as a parent image
FROM ruby:3.0-slim

# Set environment variables
ENV RACK_ENV=production

# Set the working directory in the container
WORKDIR /app

# Copy Gemfile and Gemfile.lock into the container
COPY Gemfile Gemfile.lock ./

# Install dependencies
RUN bundle install

# Copy the current directory contents into the container at /app
COPY . .

# Expose port 4567 to the outside world
EXPOSE 4567

# Command to run the Ruby application
CMD ["bundle", "exec", "rackup", "--host", "0.0.0.0", "-p", "4567"]

