# app.rb
require 'sinatra'
require 'pg'

# Configure database connection
conn = PG.connect(
  dbname: 'myapp_development',
  user: 'postgres',
  password: 'postgres',
  host: 'db',
  port: '5432'
)

# Define your routes
get '/' do
  'Hello from your Ruby backend!'
end
