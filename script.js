function analyze() {
    let data = {
        people: Number(document.getElementById("people").value),
        temp: Number(document.getElementById("temp").value),
        ventilation: document.getElementById("ventilation").value,
        air: document.getElementById("air").value
    };

    // Basic validation
    if (isNaN(data.people) || isNaN(data.temp)) {
        alert("Please enter valid numbers for People and Temperature");
        return;
    }

    fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {

        // Update values
        document.getElementById("oxygenValue").innerText = data.oxygen + "%";
        document.getElementById("productivityValue").innerText = data.productivity + "%";
        document.getElementById("riskValue").innerText = data.risk;

        // Risk color styling
        let riskBox = document.getElementById("riskBox");

        if (data.risk === "Low") {
            riskBox.style.background = "#22c55e";   // green
        } 
        else if (data.risk === "Moderate") {
            riskBox.style.background = "#facc15";   // yellow
        } 
        else {
            riskBox.style.background = "#ef4444";   // red
        }

        // Suggestions
        let list = document.getElementById("suggestions");
        list.innerHTML = "";

        if (!data.suggestions || data.suggestions.length === 0) {
            let li = document.createElement("li");
            li.innerText = "No suggestions needed";
            list.appendChild(li);
        } else {
            data.suggestions.forEach(s => {
                let li = document.createElement("li");
                li.innerText = s;
                list.appendChild(li);
            });
        }

        drawChart(data);
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Error connecting to server");
    });
}


// Prevent multiple charts stacking
let chartInstance = null;

function drawChart(data) {
    const ctx = document.getElementById("chart");

    // Destroy old chart
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Oxygen (%)', 'Productivity (%)'],
            datasets: [{
                label: "Environment Metrics",
                data: [data.oxygen, data.productivity],
                backgroundColor: ['#3b82f6', '#8b5cf6'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "white",
                        font: { size: 14 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "white" },
                    grid: { color: "#334155" }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: "white" },
                    grid: { color: "#334155" }
                }
            }
        }
    });
}