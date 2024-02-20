# web_socket_manager.rb

module WebSocketManager
	@websockets = {}

	class << self
		def add_connection(id, ws)
			@websockets[id] = {ws: ws, user: nil}
		end

		def get_connection(id)
			@websockets[id]
		end

		def get_user(id)
			@websockets[id].user
		end

		def remove_connection(id)
			@websockets.delete(id)
		end

		def broadcast(message)
			@websockets.each_value do |connection|
				connection[:ws].send message
			end
		end
	end
end