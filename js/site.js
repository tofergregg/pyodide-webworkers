import { setupWorker, 
    asyncRun, 
    passSharedBuffer, 
    sendMessageToWorker,
    interruptExecution,
    clearInterruptBuffer
} from "./py-worker.js";

const init_main = () => {
    // set option if url has option
    const params = new URLSearchParams(window.location.search);
    const example = params.get('example');
    if (example) {
        const examples = document.getElementById('examples');
        for (let i = 0; i < examples.options.length; i++) {
            if (examples.options[i].text == example) {
                examples.value = i;
                window.update_terminal();
                break;
            }
        }
    }
    // set up for mouse movement
    window.lastMouse = {x: 0, y: 0};
    const canvas = document.getElementById('theCanvas');
    canvas.addEventListener("mousemove", mouseMove, false)

    // set up for mouse button
    window.lastMouseDown = {x: 0, y: 0};
    canvas.addEventListener("mousedown", mouseDown, false)

    setupWorker();
}

window.init_main = init_main;

const mouseMove = (event) => {
    const canvas = document.getElementById('theCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    if (x > canvas.width + 1) {
        x = 0;
    }
    const y = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    if (y > canvas.height + 1) {
        y = 0;
    }
    window.lastMouse = {x: x, y: y};
}

const mouseDown = (event) => {
    const canvas = document.getElementById('theCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width);
    if (x > canvas.width + 1) {
        x = 0;
    }
    const y = Math.round((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
    if (y > canvas.height + 1) {
        y = 0;
    }
    window.lastMouseDown = {x: x, y: y};
}

async function python_runner(script, context) {
    // Shared buffers are not easily allowed any more...
    // Must have correct headers (see .htaccess)
    window.sharedBuf = new SharedArrayBuffer(65536);
    window.sharedArr = new Uint8Array(window.sharedBuf);

    window.waitBuf = new SharedArrayBuffer(4);
    window.waitArr = new Int32Array(window.waitBuf);
    // initialize
    for (let i = 0; i < 65536; i++) {
        Atomics.store(window.sharedArr, i, 0);
    }
    Atomics.store(window.waitArr, 0, 0);
    passSharedBuffer(window.sharedBuf, window.waitBuf);
    try {
        const { results, error } = await asyncRun(script, context);
        if (results) {
            console.log("pyodideWorker return results: ", results);
        } else if (error) {
            console.log("pyodideWorker error: ", error);
            // put partial error in the terminal
            if (error.startsWith('Traceback')) {
                const firstNewline = error.indexOf('\n');
                const firstUsefulError = error.indexOf('  File "<exec>"');
                const terminal = document.getElementById("console-output");
                terminal.value += '\n' + error.substring(0, firstNewline + 1) 
                    + error.substring(firstUsefulError);
                terminal.blur();
                terminal.focus();
            }
            clearInterruptBuffer();
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
        );
    }
}

///// 

window.get_input = () => {
    window.reset_console();
    const context = {}; // we might use this to pass parameters to a program,
    // e.g. { name: "Chris", num: 5, arr: [1, 2, 3], }
    const code = document.getElementById('code').value;
    python_runner(code, context);
}

window.reset_console = () => {
    if (window.codeRunning) {
        interruptExecution();
    }
    document.getElementById('console-output').value = '';
    const canvas = document.getElementById('theCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}

window.interruptExecution = () => {
    interruptExecution();
    console.log("stopping program");
}

window.update_terminal = () => {
    const snippets = [`print('Hello, World!')`,

        `first_number = int(input("Please type a number: "))
second_number = int(input("Please type another number: "))
result = first_number + second_number
print(f"The sum of {first_number} + {second_number} = {result}")`,

        `def main():
    size = int(input("Size of triangle (5-21)? "))
    triangle(size)

def triangle(n):
    for i in range(0, n, 2):
        for j in range((n - i) // 2):
            print(' ', end='')
        for j in range(i + 1):
            print('*', end='')
        print()

if __name__ == '__main__':
    main()`,
        `import time
for i in range(10):
    print(i)
    time.sleep(1)`,
        `def main():
    print('in main()')
    nextFunc()

def nextFunc():
    print("about to divide by zero...")
    a = 1 / 0

if __name__ == "__main__":
    main()`,
        `import time

def main():
    canvas = Canvas()
    radius = 10
    color = 'purple'
    x = canvas.width / 2 - radius
    y = canvas.height / 2 - radius
    dx = 3
    dy = 2
    while True:
        canvas.erase()
        canvas.fill_circle(x, y, radius * 2, color)
        x += dx
        y += dy
        if x > canvas.width - radius * 2 or x < 0:
            dx *= -1
        if y > canvas.height - radius * 2 or y < 0:
            dy *= -1
        print(f"x: {x}, y: {y}")
        time.sleep(0.01)
        clear_terminal()

if __name__ == "__main__":
    main()`,
        `import time
def main():
    canvas = Canvas()
    # Move your mouse around the white canvas!
    while True:
        mouseX = canvas.get_mouse_x()
        mouseY = canvas.get_mouse_y()
        canvas.fill_circle(mouseX, mouseY, 20, "blue")
        time.sleep(0.2)

if __name__ == "__main__":
    main()`,
        `import time
import random
import math

canvas = Canvas()
PLAY_DIFFICULTY = 5 # (0-10) lower is easier 
                    # decrease PLAY_DIFFICULTY for a slower ball
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 40
PADDLE_MARGIN = 10
LEFT_PADDLE_X = PADDLE_MARGIN 
RIGHT_PADDLE_X = canvas.width - PADDLE_MARGIN
PADDLE_COLOR = 'green'
BALL_RADIUS = 10
BALL_COLOR = 'blue'
BALL_VELOCITY = 10

def main():
    print("Move the mouse up and down")
    print("inside the white box to play!")
    ball = setup_game()
    play(ball)

def setup_game():
    draw_paddles(canvas.height / 2, canvas.height / 2)
    ball = {}
    ball['x'] = canvas.width / 2
    ball['y'] = canvas.height / 2
    ball['dx'] = random.randint(5, 9)
    if random.randint(0, 1) % 2 == 0: ball['dx'] *= -1

    ball['dy'] = math.sqrt(BALL_VELOCITY ** 2 - ball['dx'] ** 2) 
    if random.randint(0, 1) % 2 == 0: ball['dy'] *= -1

    draw_ball(ball)

    return ball
    

def draw_paddles(leftY, rightY):
    canvas.fill_rect(LEFT_PADDLE_X, 
                       leftY - PADDLE_HEIGHT / 2, 
                       PADDLE_WIDTH, 
                       PADDLE_HEIGHT,
                       PADDLE_COLOR)
    
    canvas.fill_rect(RIGHT_PADDLE_X - PADDLE_WIDTH, 
                       rightY - PADDLE_HEIGHT / 2, 
                       PADDLE_WIDTH, 
                       PADDLE_HEIGHT,
                       PADDLE_COLOR)

def draw_ball(ball):
    canvas.fill_circle(ball['x'] - BALL_RADIUS, ball['y'] - BALL_RADIUS, 
                       BALL_RADIUS, BALL_COLOR)

def move_ball(ball):
    ball['x'] += ball['dx']
    ball['y'] += ball['dy']
    # bounce at ceiling and floor
    if ball['y'] < BALL_RADIUS:
        ball['dy'] = abs(ball['dy'])
    if ball['y'] > canvas.height:
        ball['dy'] = -abs(ball['dy'])

def bounce_off_paddles(ball, left_y, right_y):
    # if any part of the ball is touching the paddle, bounce
    # left
    if (LEFT_PADDLE_X <= ball['x'] - BALL_RADIUS 
                     <= LEFT_PADDLE_X + PADDLE_WIDTH and
        left_y - PADDLE_HEIGHT <= ball['y'] - BALL_RADIUS <= left_y + PADDLE_HEIGHT):
        bounce_and_fuzz(ball, 1)

    # right
    if RIGHT_PADDLE_X - PADDLE_WIDTH <= ball['x'] <= RIGHT_PADDLE_X:
        bounce_and_fuzz(ball, -1)

def bounce_and_fuzz(ball, final_direction):
    if final_direction == -1: 
        ball['dx'] = -abs(ball['dx']) 
    else:
        ball['dx'] = abs(ball['dx'])
    if ball['dx'] < 0:
        ball['dx'] = max(-9, min(-4, ball['dx'] + random.randint(-3, 3)))
    else:
        ball['dx'] = max(4, min(4, ball['dx'] + random.randint(-3, 3)))
    fix_speed(ball)

def fix_speed(ball):
    # change dy to match dx
    dy_neg = ball['dy'] < 0
    ball['dy'] = math.sqrt(BALL_VELOCITY ** 2 - ball['dx'] ** 2) 
    if dy_neg:
        ball['dy'] *= -1

def score_and_reset(ball, score):
    # if the ball is outside the bounds of the canvas,
    # someone scored
    if ball['x'] < 0:
        # score for right player
        score[1] += 1
        canvas.erase()
        ball = setup_game()
    elif ball['x'] > canvas.width:
        # score for left player
        score[0] += 1
        canvas.erase()
        ball = setup_game()

    return ball



def play(ball):
    score = [0, 0]
    while True:
        canvas.erase()
        draw_ball(ball)
        last_mouse_y = canvas.get_mouse_y()
        draw_paddles(last_mouse_y, ball['y'])
        bounce_off_paddles(ball, last_mouse_y, ball['y'])
        score_str = f"{score[0]} | {score[1]}" 
        canvas.draw_string(canvas.width / 2 - 20, 20, score_str, 'black')
        time.sleep((11 - PLAY_DIFFICULTY) * 0.005)
        move_ball(ball)
        ball = score_and_reset(ball, score)

if __name__ == "__main__":
    main()
`,
    ]

    const value = document.getElementById('examples').value;
    const console = document.getElementById('code');
    console.value = snippets[value]; 
}

