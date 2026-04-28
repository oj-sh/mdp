from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)

# ---------------- DATABASE ----------------
def init_db():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        people INTEGER,
        temp INTEGER,
        ventilation TEXT,
        air TEXT,
        oxygen INTEGER,
        productivity INTEGER,
        risk TEXT,
        timestamp TEXT
    )''')
    conn.commit()
    conn.close()

init_db()


# ---------------- ROUTES ----------------

# 🏠 MAIN HOMEPAGE
@app.route('/')
def home():
    return render_template('home.html')


# 🚀 ANALYZER PAGE
@app.route('/analyzer')
def analyzer():
    return render_template('index.html')


# 📊 ANALYZE API
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json

    people      = int(data.get('people', 0))
    temp        = int(data.get('temp', 0))
    ventilation = data.get('ventilation', 'low')
    air         = data.get('air', 'poor')

    # -------- OXYGEN --------
    oxygen = 100 - (people * 1.2)

    if ventilation == "low":
        oxygen -= 20
    elif ventilation == "medium":
        oxygen -= 10

    if air == "poor":
        oxygen -= 15
    elif air == "moderate":
        oxygen -= 5

    oxygen = max(0, min(100, oxygen))

    # -------- PRODUCTIVITY --------
    productivity = 100 - abs(temp - 24) * 2.5
    productivity = max(0, min(100, productivity))

    # -------- CO2 --------
    co2 = 400 + (people * 20)
    if ventilation == "low":
        co2 += 300
    elif ventilation == "medium":
        co2 += 150

    # -------- COMFORT --------
    comfort = (oxygen * 0.4) + (productivity * 0.4) - (co2 / 50)
    comfort = max(0, min(100, int(comfort)))

    # -------- RISK --------
    if oxygen < 40 or co2 > 1500:
        risk = "High"
    elif oxygen < 70:
        risk = "Moderate"
    else:
        risk = "Low"

    # -------- SUGGESTIONS --------
    suggestions = []

    if ventilation == "low":
        suggestions.append("Improve ventilation")

    if people > 30:
        suggestions.append("Reduce crowd density")

    if temp > 30:
        suggestions.append("Lower temperature")

    if air == "poor":
        suggestions.append("Use air purifier")

    if co2 > 1000:
        suggestions.append("Increase fresh air circulation")

    if oxygen < 50:
        suggestions.append("Avoid overcrowding")

    # -------- SAVE TO DATABASE --------
    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    c.execute('''INSERT INTO records 
        (people, temp, ventilation, air, oxygen, productivity, risk, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (people, temp, ventilation, air, int(oxygen), int(productivity), risk, datetime.now().isoformat())
    )

    conn.commit()
    conn.close()

    return jsonify({
        "oxygen":       int(oxygen),
        "productivity": int(productivity),
        "co2":          int(co2),
        "comfort":      comfort,
        "risk":         risk,
        "suggestions":  suggestions
    })


# 📜 HISTORY API  — returns all 9 columns so the frontend can rebuild charts
@app.route('/history')
def history():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()

    # id | people | temp | ventilation | air | oxygen | productivity | risk | timestamp
    c.execute("SELECT * FROM records ORDER BY id DESC LIMIT 20")
    data = c.fetchall()

    conn.close()
    return jsonify(data)


# ---------------- RUN ----------------
if __name__ == '__main__':
    app.run(debug=True, port=5007)
    # DELETE single record
@app.route('/delete/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("DELETE FROM records WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# DELETE all history
@app.route('/delete-all', methods=['DELETE'])
def delete_all():
    conn = sqlite3.connect("database.db")
    c = conn.cursor()
    c.execute("DELETE FROM records")
    conn.commit()
    conn.close()
    return jsonify({"success": True})