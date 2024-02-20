require 'rubygems'
require 'em-websocket'
require 'em-http-server'
require 'mime/types'
require 'json'
require_relative 'websocket'


# require 'sinatra'
# require 'pg'
# require 'dotenv/load'

# # Configure database connection
# conn = PG.connect(
#   dbname: ENV['POSTGRES_DB'],
#   user: ENV['POSTGRES_USER'],
#   password: ENV['POSTGRES_PASSWORD'],
#   host: ENV['POSTGRES_HOST'],
#   port: ENV['POSTGRES_PORT']
# )

# # Define your routes
# get '/' do
#   'Hello from your Ruby backend!'
# end


def path_get_absolute(fspath)
	absolute_path = File.expand_path(fspath)
	# absolute_path += File::SEPARATOR unless absolute_path.end_with?(File::SEPARATOR)

	return absolute_path
end

def path_contains_base_path?(target_path, base_path)
	# Expand both paths to their absolute forms
	absolute_target_path = path_get_absolute(target_path)
	absolute_base_path = path_get_absolute(base_path)

	# Check if the target path starts with the base path
	return absolute_target_path.start_with?(absolute_base_path)
end

$ws_port = 3000
$http_port = 8080
$static_dir = path_get_absolute('./static')

EM.run do
	# WebSocket Server
	EM::WebSocket.run(host: "0.0.0.0", port: $ws_port) do |ws|
		ws.onopen do
			puts "Client connected #{ws.object_id}"
			WebSocketManager.add_connection(ws.object_id, ws)
			WebSocketManager.broadcast("client " + ws.object_id.to_s + " connected")
		end

		ws.onmessage do |msg|
			puts "Received message: #{msg}"
			WebSocketManager.broadcast("client " + ws.object_id.to_s + " " + msg)
		end

		ws.onclose do
			puts "Client disconnected"
			WebSocketManager.remove_connection(ws.object_id)
			WebSocketManager.broadcast("client " + ws.object_id.to_s + " disconnected")
		end

		ws.onerror do |error|
			puts "Error occurred: #{error}"
		end
	end

	puts "WebSocket server started on ws://0.0.0.0:#{$ws_port}"

	# HTTP Server
	class HttpServer < EM::HttpServer::Server
		def process_http_request
			# You can access the HTTP method: @http_request_method ('GET', 'POST', etc.)
			# The URI: @http_path_info
			# Query string: @http_query_string
			# And the post content: @http_post_content

			response = EM::DelegatedHttpResponse.new(self)

			puts "Received HTTP request: #{@http_request_method} #{@http_request_uri}"
			uri = @http_request_uri

			# Simple routing example
			case uri
			when '/'
				response.status = 200
				response.content_type 'text/html'
				file_path = File.join($static_dir, 'index.html')
				puts file_path
				puts File.exist?(file_path)
				if File.exist?(file_path)
					response.content = File.read(file_path)
				else
					response.status = 404
					response.content_type 'text/plain'
					response.content = 'File Not Found'
				end
			when '/health'
				response.status = 200
				response.content_type 'text/plain'
				response.content = 'OK'
			else
				absolute_path = path_get_absolute(File.join($static_dir, uri))
				if !path_contains_base_path?(absolute_path, $static_dir)
					response.status = 400
					response.content_type 'text/plain'
					response.content = 'Bad Request'
				elsif File.exist?(absolute_path) && File.readable?(absolute_path)
					response.status = 200
					response.content_type MIME::Types.type_for(absolute_path).first.content_type
					response.content = File.read(absolute_path)
				else
					response.status = 404
					response.content_type 'text/plain'
					response.content = 'File Not Found'
				end
			end

			# puts "Sending response..."
			response.send_response
		end
	end

	# Start the HTTP server
	EM.start_server "0.0.0.0", $http_port, HttpServer
	puts "HTTP server started on http://0.0.0.0:#{$http_port}"
end