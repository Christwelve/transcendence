from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)
STATE_FILE_PATH = "/workspace/pong_ai/game_state.json"

# Load the game state from the JSON file, or return an empty dictionary if not found
def load_game_state():
    if os.path.exists(STATE_FILE_PATH):
        with open(STATE_FILE_PATH, "r") as f:
            return json.load(f)
    return {}

# Save the given game state to the JSON file
def save_game_state(game_state):
    with open(STATE_FILE_PATH, "w") as f:
        json.dump(game_state, f)


# Endpoint to retrieve the current game state
@app.route('/api/state', methods=['GET'])
def state():
    return jsonify(load_game_state())

# Endpoint to update the AI paddle position
@app.route('/api/move_ai', methods=['POST'])
def move_ai():
    data = request.json
    new_y = data.get('y')
    if new_y is not None:
        game_state = load_game_state()
        print("Loaded game state before update:", game_state)  # Debugging
        game_state['ai_paddle'] = new_y
        print("Updated game state with new AI paddle position:", game_state)  # Debugging
        save_game_state(game_state)
        print("Saved game state to file.")  # Debugging
        return jsonify({"status": "success"}), 200
    return jsonify({"error": "Invalid data"}), 400

# Endpoint to request an update in the game state
@app.route('/api/update', methods=['POST'])
def update():
    return jsonify({"status": "updated"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
