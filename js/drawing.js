const updateCanvas = (cmd, dict) => {
    const canvas = document.getElementById('theCanvas');
    if (cmd == 'create') {
        canvas._objects.push(dict);
    }

    if (cmd == 'move') {
        const obj = canvas._objects[dict.obj];
        obj.coords[0] += dict.x_amount;
        obj.coords[1] += dict.y_amount;
        obj.coords[2] += dict.x_amount;
        obj.coords[3] += dict.y_amount;
    }

    if (cmd == 'coords') {
        const obj = canvas._objects[dict.obj];
        obj.coords = dict.coords;
    }

    window.requestAnimationFrame(drawAllObjects);
}

const drawAllObjects = () => {
    const canvas = document.getElementById('theCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let obj of canvas._objects) {
        if (obj.obj == 'text') {
            ctx.font = '18px serif';
            ctx.fillStyle = obj.fill;
            ctx.fillText(obj.text, obj.coords[0], obj.coords[1]);
        } else {
            ctx.beginPath();
            if (obj.obj == 'line') {
                ctx.moveTo(obj.coords[0], obj.coords[1]);
                ctx.lineTo(obj.coords[2], obj.coords[3]);
            } else if (obj.obj == 'oval') {
            } else if (obj.obj == 'rectangle') {
                ctx.rect(obj.coords[0], obj.coords[1], obj.coords[2], obj.coords[3]);
            }
            if (obj.fill != '') {
                ctx.fillStyle = obj.fill;
                ctx.fill();
            }
            ctx.strokeStyle = obj.color;
            ctx.stroke();
        }
    }
}

const drawShape = (shape, a, b, c, d, color='black', stroke=true, fill=false) => {
    window.requestAnimationFrame(() => {
        drawShapeInAnimation(shape, a, b, c, d, color, stroke, fill);
    });
}

const drawShapeInAnimation = (shape, a, b, c, d, color, stroke, fill) => {
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
            ctx.fillStyle = d;
            
            ctx.fillText(c, a, b);
            return;
        } else if (shape == 'erase') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
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

export { drawShape };
