import { asyncRun, passSharedBuffer, sendMessageToWorker } from "./py-worker.js";

const script = `
    import time
    from js import sleep_fixed
    time.sleep = sleep_fixed
    import statistics
    from js import A_rank

    def main():
        a = input("hello?")
        # statistics.stdev(A_rank)

        print("all done!")
    if __name__ == "__main__":
        main()
`;

const init_main = () => {
    //    window.pyodide_ready = false;
    //    start_pyodide();
    // Shared buffers are not easily allowed any more...
    // Must have correct headers (see .htaccess)
    window.sharedBuf = new SharedArrayBuffer(65536);
    window.sharedArr = new Uint8Array(window.sharedBuf);
    // initialize
    for (let i = 0; i < 65536; i++) {
        Atomics.store(window.sharedArr, i, 0);
    }
    passSharedBuffer(window.sharedBuf);
}

window.init_main = init_main;

async function python_runner(script, context) {
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
        }
    } catch (e) {
        console.log(
            `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
        );
    }
}

///// 

async function start_pyodide() {
    const output = document.getElementById("console-output");
    window.abc = '';
    window.pyodide = await loadPyodide({
        indexURL : "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/",
        stdout: text => {
            output.value += text + '\n';
        },
        stderr: text => {
            output.value += text + '\n';
        }
    });
    // fix for input with prompt:
    pyodide.runPython(`
    from js import input_fixed
    input = input_fixed
    __builtins__.input = input_fixed
    `);

    // Pyodide is now ready to use...
    window.pyodide_ready = true;
    output.value = "";
    document.getElementById('click-button').disabled = false;
}

window.get_input = () => {
    const context = {}; // we might use this to pass parameters to a program,
    // e.g. { name: "Chris", num: 5, arr: [1, 2, 3], }
    const code = document.getElementById('code').value;
    python_runner(code, context);
}

window.reset_console = () => {
    document.getElementById('console-output').value = ''

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
    ]

    const value = document.getElementById('examples').value;
    const console = document.getElementById('code');
    console.value = snippets[value]; 
}

window.drawShape = (shape, a, b, c, d) => {
    const canvas = document.getElementById('theCanvas');
    if (shape == 'oval') {
        const ctx = canvas.getContext('2d');
        ctx.ellipse(a, b, c, d, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}
