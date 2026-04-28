window.onload = function () {

    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    let particles = [];

for (let i = 0; i < 120; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 1.2,
        dy: (Math.random() - 0.5) * 1.2,
        r: Math.random() * 2 + 1,
        opacity: Math.random()
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {

        // glowing floating dots
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#3b82f6";
        ctx.fill();

        // movement
        p.x += p.dx;
        p.y += p.dy;

        // bounce
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    requestAnimationFrame(animate);
}

    animate();
};