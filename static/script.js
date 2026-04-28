// ================== ANALYZE FUNCTION ==================
function analyze() {
    let data = {
        people: Number(document.getElementById("people").value),
        temp: Number(document.getElementById("temp").value),
        ventilation: document.getElementById("ventilation").value,
        air: document.getElementById("air").value
    };

    if (isNaN(data.people) || isNaN(data.temp)) {
        alert("Please enter valid numbers");
        return;
    }

    fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {

        document.getElementById("oxygenValue").innerText      = data.oxygen + "%";
        document.getElementById("productivityValue").innerText = data.productivity + "%";
        document.getElementById("riskValue").innerText        = data.risk;
        document.getElementById("co2Value").innerText         = data.co2 + " ppm";
        document.getElementById("comfortValue").innerText     = data.comfort + "%";

        let riskBox = document.getElementById("riskBox");

        if (data.risk === "Low") {
            riskBox.style.background = "#22c55e";
        } else if (data.risk === "Moderate") {
            riskBox.style.background = "#facc15";
        } else {
            riskBox.style.background = "#ef4444";
            alert("⚠️ High Risk Environment!");
        }

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
    .catch(err => console.error(err));
}


// ================== LIVE CHART ==================
let chartInstance = null;

function drawChart(data) {
    const ctx = document.getElementById("chart");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Oxygen', 'Productivity', 'Comfort'],
            datasets: [{
                label: "Metrics",
                data: [data.oxygen, data.productivity, data.comfort],
                backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { beginAtZero: true, max: 100, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });
}


// ================== HISTORY ==================
function loadHistory() {
    fetch('/history')
    .then(res => res.json())
    .then(rows => {
        let container = document.getElementById("historyCards");
        container.innerHTML = "";

        if (!rows || rows.length === 0) {
            container.innerHTML = "<p style='opacity:0.5;'>No history found.</p>";
            return;
        }

        rows.forEach(row => {
            // row: [id, people, temp, ventilation, air, oxygen, productivity, risk, timestamp]
            let id          = row[0];
            let people      = row[1];
            let temp        = row[2];
            let ventilation = row[3];
            let air         = row[4];
            let oxygen      = row[5];
            let productivity= row[6];
            let risk        = row[7];
            let timestamp   = row[8];

            let riskClass = risk === "Low" ? "risk-low" : risk === "Moderate" ? "risk-moderate" : "risk-high";

            let card = document.createElement("div");
            card.className = "history-card";
            card.innerHTML = `
                <div class="hc-title">${timestamp ? new Date(timestamp).toLocaleString() : "—"}</div>
                <div class="hc-row"><span>👥 People</span><span>${people}</span></div>
                <div class="hc-row"><span>🌡 Temp</span><span>${temp}°C</span></div>
                <div class="hc-row"><span>💨 Ventilation</span><span>${ventilation}</span></div>
                <div class="hc-row"><span>🌬 Air</span><span>${air}</span></div>
                <div class="hc-row"><span>O₂</span><span>${oxygen}%</span></div>
                <div class="hc-row"><span>Productivity</span><span>${productivity}%</span></div>
                <div class="hc-risk ${riskClass}">⚠️ ${risk} Risk</div>
                <button class="hc-chart-btn" onclick="openHistoryChart(${id}, ${people}, ${temp}, '${ventilation}', '${air}', ${oxygen}, ${productivity}, '${risk}', '${timestamp}')">
                    📊 View Chart
                </button>
            `;
            container.appendChild(card);
        });
    })
    .catch(err => console.error(err));
}


// ================== HISTORY MODAL CHART ==================
let historyChartInstance = null;

function openHistoryChart(id, people, temp, ventilation, air, oxygen, productivity, risk, timestamp) {
    // Re-compute CO2 and comfort from stored inputs (same logic as backend)
    let co2 = 400 + (people * 20);
    if (ventilation === "low")    co2 += 300;
    else if (ventilation === "medium") co2 += 150;

    let comfort = (oxygen * 0.4) + (productivity * 0.4) - (co2 / 50);
    comfort = Math.max(0, Math.min(100, Math.round(comfort)));

    // Set modal title + meta
    document.getElementById("modalTitle").innerText = `Chart — Record #${id}`;
    document.getElementById("modalMeta").innerHTML = `
    <button class="hc-delete-btn" onclick="deleteRecord(${id}, this)">🗑 Delete</button>
    
        <span>👥 ${people} people</span>
        <span>🌡 ${temp}°C</span>
        <span>💨 ${ventilation}</span>
        <span>🌬 ${air}</span>
        <span>📅 ${timestamp ? new Date(timestamp).toLocaleString() : '—'}</span>
    `;

    // Show modal
    let modal = document.getElementById("historyChartModal");
    modal.classList.add("open");
    modal.style.display = "flex";

    // Destroy previous chart
    if (historyChartInstance) historyChartInstance.destroy();

    const ctx = document.getElementById("historyChart");
    historyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Oxygen', 'Productivity', 'Comfort'],
            datasets: [{
                label: `Record #${id} Metrics`,
                data: [oxygen, productivity, comfort],
                backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#fff' } }
            },
            scales: {
                x: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.08)' } },
                y: { beginAtZero: true, max: 100, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.08)' } }
            }
        }
    });
}

function closeModal(event) {
    // Close only if clicking the backdrop, not the modal content
    if (event.target === document.getElementById("historyChartModal")) {
        document.getElementById("historyChartModal").style.display = "none";
        document.getElementById("historyChartModal").classList.remove("open");
    }
}


// ================== BACKGROUND (4 LAYERS) ==================
window.onload = function () {

    // ================= LAYER 3: MAIN PARTICLES =================
    const canvas = document.getElementById("bgCanvas");
    const ctx    = canvas.getContext("2d");

    // ================= LAYER 4: GLOW ORBS =================
    const glowCanvas = document.getElementById("glowCanvas");
    const gtx        = glowCanvas.getContext("2d");

    function resize() {
        canvas.width     = window.innerWidth;
        canvas.height    = window.innerHeight;
        glowCanvas.width  = window.innerWidth;
        glowCanvas.height = window.innerHeight;
    }
    resize();

    // -------- PARTICLES --------
    const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 9000);
    let particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x:  Math.random() * canvas.width,
            y:  Math.random() * canvas.height,
            dx: (Math.random() - 0.5) * 0.8,
            dy: (Math.random() - 0.5) * 0.8,
            r:  Math.random() * 1.8 + 1
        });
    }

    // -------- GLOW ORBS --------
    let orbs = [];
    for (let i = 0; i < 20; i++) {
        orbs.push({
            x:  Math.random() * glowCanvas.width,
            y:  Math.random() * glowCanvas.height,
            r:  Math.random() * 40 + 20,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        gtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);

        // ---- PARTICLES ----
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle   = "rgba(255,255,255,0.85)";
            ctx.shadowBlur  = 6;
            ctx.shadowColor = "rgba(99,102,241,0.6)";
            ctx.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width)  p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
        });

        // ---- LINES ----
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx   = particles[i].x - particles[j].x;
                let dy   = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    let alpha = 1 - dist / 140;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255,255,255,${0.15 * alpha})`;
                    ctx.lineWidth   = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // ---- GLOW ORBS ----
        orbs.forEach(o => {
            let gradient = gtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            gradient.addColorStop(0, "rgba(139,92,246,0.6)");
            gradient.addColorStop(1, "rgba(59,130,246,0)");

            gtx.fillStyle = gradient;
            gtx.beginPath();
            gtx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            gtx.fill();

            o.x += o.dx;
            o.y += o.dy;

            if (o.x < 0)              o.x = glowCanvas.width;
            if (o.x > glowCanvas.width)  o.x = 0;
            if (o.y < 0)              o.y = glowCanvas.height;
            if (o.y > glowCanvas.height) o.y = 0;
        });

        requestAnimationFrame(animate);
    }

    animate();
    window.addEventListener("resize", resize);
};