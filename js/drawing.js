const drawShape = (shape, a, b, c, d, color='black', stroke=true, fill=false) => {
    const canvas = document.getElementById('theCanvas');
    const ctx = canvas.getContext('2d');

    ctx.beginPath();

    if (shape == 'oval') {
        // we need to translate from (x, y, width, height) to:
        // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise)
        // For ellipse, x, y are center coordinates
        const centerX = a + c / 2;
        const centerY = b + d / 2;
        const radiusX = c / 2;
        const radiusY = d / 2;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    } else if (shape == 'rect') {
        // (x, y, width, height)
        ctx.rect(a, b, c, d);
    } else if (shape == 'line') {
        // (x1, y1, x2, y2)
        ctx.moveTo(a, b);
        ctx.lineTo(c, d);
    } else if (shape == 'text') {
        // (x, y, text)
        ctx.font = '18px serif';
        ctx.fillText(a, b, c);
        return;
    }

    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    }
    if (stroke) {
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}
