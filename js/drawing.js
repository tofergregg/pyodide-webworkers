const updateCanvas = (cmd, dict) => {
    dict = Object.fromEntries(dict); // was a Map
    const canvas = document.getElementById('theCanvas');
    if (cmd == 'create') {
        canvas._objects.push(dict);
    }

    if (cmd == 'move') {
        const obj = canvas._objects[dict.obj];
        if (obj.obj == 'rectangle') {
            // width/height instead of x2, y2
            obj.coords[0] += dict.x_amount;
            obj.coords[1] += dict.y_amount;
        } else {
            obj.coords[0] += dict.x_amount;
            obj.coords[1] += dict.y_amount;
            obj.coords[2] += dict.x_amount;
            obj.coords[3] += dict.y_amount;
        }
    }

    if (cmd == 'coords') {
        const obj = canvas._objects[dict.obj];
        obj.coords = dict.coords;
    }

    if (cmd == 'delete') {
        const obj = canvas._objects[dict.obj];
        obj.obj = 'deleted';
    }

    if (cmd == 'itemconfigure') {
        const obj = canvas._objects[dict.obj];
        obj.text = dict.text;
    }

    if (cmd == 'clearall') {
        canvas._objects = []
    }

    window.requestAnimationFrame(drawAllObjects);
}

const drawAllObjects = () => {
    const canvas = document.getElementById('theCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let obj of canvas._objects) {
        if (obj.obj == 'deleted') {
            continue;
        }
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
                const x1 = obj.coords[0];
                const y1 = obj.coords[1];
                const x2 = obj.coords[2];
                const y2 = obj.coords[3];
                // we need to translate from (x1, y1, x2, y2) to:
                // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise)
                // For ellipse, x, y are center coordinates
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;
                const radiusX = (x2 - x1) / 2;
                const radiusY = (y2 - y1) / 2;
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            } else if (obj.obj == 'rectangle') {
                // translate x2, y2 to width, height
                const width = obj.coords[2] - obj.coords[0];
                const height = obj.coords[3] - obj.coords[1];
                ctx.rect(obj.coords[0], obj.coords[1], width, height);
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

export { updateCanvas };
