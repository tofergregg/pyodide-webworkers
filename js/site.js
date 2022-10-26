import { setupWorker, 
    asyncRun, 
    passSharedBuffer, 
    sendMessageToWorker,
    interruptExecution,
    clearInterruptBuffer
} from "./py-worker.js";

const init_main = () => {
    // set up for mouse movement
    const canvas = document.getElementById('theCanvas');
    canvas.addEventListener("mousemove", mouseMove, false)
    setupWorker();
}

window.init_main = init_main;

const mouseMove = (event) => {
    window.lastMouse = {x: event.pageX, y: event.pageY};
}

async function python_runner(script, context) {
    // Shared buffers are not easily allowed any more...
    // Must have correct headers (see .htaccess)
    window.sharedBuf = new SharedArrayBuffer(65536);
    window.sharedArr = new Uint8Array(window.sharedBuf);
    // initialize
    for (let i = 0; i < 65536; i++) {
        Atomics.store(window.sharedArr, i, 0);
    }
    passSharedBuffer(window.sharedBuf);
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

if __name__ == "__main__":
    main()`,
    ]

    const value = document.getElementById('examples').value;
    const console = document.getElementById('code');
    console.value = snippets[value]; 
}

