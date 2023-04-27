// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");
importScripts("./drawingPyLib2.js");

async function loadPyodideAndPackages() {
    let first = true;
    self.pyodide = await loadPyodide({
        stdout: text => {
            if (text == "Python initialization complete" && first) {
                first = false;
                return;
            }
            // console.log("output: " + text);
            self.postMessage({outputText: text + '\n'});
        },
        stderr: text => {
            // console.log("output: " + text);
            self.postMessage({outputText: text + '\n'});
        }
    });
    // await self.pyodide.loadPackage(["numpy", "pytz"]);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.jsMessage = null; 

self.onmessage = async (event) => {
    if (event.data.cmd === "setInterruptBuffer") {
        self.interruptBuffer = new Uint8Array(event.data.interruptBuffer);
        return;
    }
    if (event.data.control !== undefined) {
        console.log("Control event");
        self.jsMessage = event.data.message;
        return;
    }
    if (event.data.buffer !== undefined) {
        // got the shared buffers
        self.sharedArr = new Uint8Array(event.data.buffer);
        self.waitArr = new Int32Array(event.data.waitBuffer);
        return;
    }

    // make sure loading is done
    await pyodideReadyPromise;
    self.pyodide.setInterruptBuffer(self.interruptBuffer);
    // Don't bother yet with this line, suppose our API is built in such a way:
    let { id, python, ...context } = event.data;
    // The worker copies the context in its own "memory" (an object mapping name to values)
    for (const key of Object.keys(context)) {
        self[key] = context[key];
    }
    // Now is the easy part, the one that is similar to working in the main thread:
    try {
        await self.pyodide.runPythonAsync(`
        from js import input_fixed
        input = input_fixed
        __builtins__.input = input_fixed
        `);
        await self.pyodide.runPythonAsync(drawingLib);
        await self.pyodide.loadPackagesFromImports(python);
        python = fixTimeImport(python)
        let results = await self.pyodide.runPythonAsync(python);
        self.postMessage({ results, id });
    } catch (error) {
        self.postMessage({ error: error.message, id });
    }
};

function input_fixed(text) {
    console.log("input requested: " + text)
    self.postMessage({outputText: text, getInput: true});

    data = '4'
    return data;
};

function sleep_fixed(t) {
    // console.log("Requested " + t + " seconds of sleep");
    let start = Date.now();
    while (Date.now() - start < t * 1000) { }
    // console.log("after sleeping");
}

const fixTimeImport = (code) => {
    // this function finds `import time` and on the next line
    // it inserts code to fix the time.sleep function to work with pyodide
    // Notes: 
    // 1. it does not fix "import time, sys" constructs
    const insertCode1 = 'import time; from js import sleep_fixed; time.sleep = sleep_fixed\n';
    const insertCode2 = 'from time import sleep; from js import sleep_fixed; sleep = sleep_fixed\n';
    code = code.replace('import time\n', insertCode1);
    code = code.replace('from time import sleep\n', insertCode2);
    return code;
}

function updateCanvas(cmd, dict) {
    self.postMessage({cmd: 'updateCanvas', 'canvasCmd': cmd, 'dict': dict.toJs()});
}

function getMousePos(x_or_y) {
    Atomics.store(self.sharedArr, 0, 0);
    self.postMessage({cmd: 'getMousePos'});
    // while (Atomics.load(self.sharedArr, 0) == 0) {}; // spin
    Atomics.wait(self.waitArr, 0, 0);
    if (x_or_y == 'x') {
        return Atomics.load(self.sharedArr, 1) + Atomics.load(self.sharedArr, 2) * 256;
    } else {
        return Atomics.load(self.sharedArr, 3) + Atomics.load(self.sharedArr, 4) * 256;
    }
}

function getMouseDown(x_or_y) {
    Atomics.store(self.sharedArr, 0, 0);
    self.postMessage({cmd: 'getMouseDownPos'});

    Atomics.wait(self.waitArr, 0, 0);
        return [Atomics.load(self.sharedArr, 1) + Atomics.load(self.sharedArr, 2) * 256, Atomics.load(self.sharedArr, 3) + Atomics.load(self.sharedArr, 4) * 256];
}

function clearTerminal() {
    self.postMessage({cmd: 'clearTerminal'});
}

