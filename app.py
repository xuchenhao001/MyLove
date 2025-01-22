from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import os
from datetime import datetime

app = Flask(__name__)

# Configuration for JSON file (adjust path if needed)
WORKDAY_DATA_FILE = os.path.join(app.root_path, 'static', 'assets', 'workdayData.json')

# --- Helper Functions ---

def load_workday_data():
    try:
        with open(WORKDAY_DATA_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print('Workday data file not found. Creating an empty one.')
        empty_data = {}
        save_workday_data_to_file(empty_data)  # Create the file
        return empty_data

def save_workday_data_to_file(workday_data):
    with open(WORKDAY_DATA_FILE, 'w') as f:
        json.dump(workday_data, f, indent=4)  # Use json.dump for writing JSON

def load_timeline_data():
    filepath = os.path.join(app.root_path, 'static', 'assets', 'timelineData.json')
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                          'favicon.ico',mimetype='image/vnd.microsoft.icon')

@app.route('/assets/<path:filename>')
def custom_static(filename):
    return send_from_directory(
        os.path.join(app.root_path, 'static', 'assets'),
        filename
    )

@app.route('/getTimelineData', methods=['GET'])
def get_timeline_data():
    timeline_data = load_timeline_data()
    return jsonify(timeline_data)

@app.route('/saveWorkdayData', methods=['POST'])
def save_workday_data():
    try:
        workday_data = request.get_json()  # Get JSON data directly

        save_workday_data_to_file(workday_data)
        return jsonify({'message': 'Workday data saved successfully.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getWorkdayData', methods=['GET'])
def get_workday_data():
    workday_data = load_workday_data()
    return jsonify(workday_data)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=3414)
