from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json

    people = int(data.get('people', 0))
    temp = int(data.get('temp', 0))
    ventilation = data.get('ventilation', 'low')
    air = data.get('air', 'poor')

    # Oxygen calculation
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

    # Productivity
    productivity = 100 - abs(temp - 24) * 2.5
    productivity = max(0, min(100, productivity))

    # Risk
    if oxygen < 40:
        risk = "High"
    elif oxygen < 70:
        risk = "Moderate"
    else:
        risk = "Low"

    # Suggestions
    suggestions = []
    if ventilation == "low":
        suggestions.append("Improve ventilation")
    if people > 30:
        suggestions.append("Reduce crowd")
    if temp > 30:
        suggestions.append("Lower temperature")
    if air == "poor":
        suggestions.append("Improve air quality")

    return jsonify({
        "oxygen": int(oxygen),
        "productivity": int(productivity),
        "risk": risk,
        "suggestions": suggestions
    })

if __name__ == '__main__':
    app.run(debug=True)