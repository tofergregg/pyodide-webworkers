// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.data`, `.json`,
// and `.wasm` files as well:
importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");

async function loadPyodideAndPackages() {
    self.pyodide = await loadPyodide({
        stdout: text => {
            // console.log("output: " + text);
            self.postMessage({outputText: text + '\n'});
        },
        stderr: text => {
            // console.log("output: " + text);
            self.postMessage({outputText: text + '\n'});
        }
    });
    await self.pyodide.loadPackage(["numpy", "pytz"]);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.jsMessage = null; 

self.onmessage = async (event) => {
    if (event.data.control !== undefined) {
        console.log("Control event");
        self.jsMessage = event.data.message;
        return;
    }
    if (event.data.buffer !== undefined) {
        // got a shared buffer
        self.sharedBuf = new Int8Array(event.data.buffer);
        return;
    }

    // make sure loading is done
    await pyodideReadyPromise;
    // Don't bother yet with this line, suppose our API is built in such a way:
    const { id, python, ...context } = event.data;
    // The worker copies the context in its own "memory" (an object mapping name to values)
    for (const key of Object.keys(context)) {
        self[key] = context[key];
    }
    // Now is the easy part, the one that is similar to working in the main thread:
    try {
        await self.pyodide.runPythonAsync(`
        from js import input_fixed
        from js import wait_for_js_message
        input = input_fixed
        __builtins__.input = input_fixed
        def wait_for_message():
            # for i in range(10000):
            while True:
                message = wait_for_js_message()
                # print(f"msg: {message}")
                if message:
                    return message
        `);
        await self.pyodide.loadPackagesFromImports(python);
        let results = await self.pyodide.runPythonAsync(python);
        self.postMessage({ results, id });
    } catch (error) {
        self.postMessage({ error: error.message, id });
    }
};

function input_fixed(text) {
    // console.log("input requested: " + text)
    self.postMessage({outputText: text, getInput: true});
    while (self.sharedBuf[0] != 0) {} // spin
    const temp = self.sharedBuf[0];
    self.sharedBuf[0] = 0;
    console.log("shared buf[1]:");
    console.log(self.sharedBuf[1]);


    return self.sharedBuf[1];
};

function sleep_fixed(t) {
    // console.log("Requested " + t + " seconds of sleep");
    let start = Date.now();
    while (Date.now() - start < t * 1000) { }
    // console.log("after sleeping");
}

function wait_for_js_message() {
    // console.log(self.sharedBuf[0]);
    if (self.sharedBuf[0] != 0) {
        // console.log(sharedBuf[0]);
        waiting_for_message();
        const sharedVal = self.sharedBuf[0];
        self.sharedBuf[0] = 0;
        return sharedVal;
    } else {
        return null;
    }
    const temp = self.jsMessage 
    self.jsMessage = null
    return temp 
}

async function waiting_for_message() {
    // console.log("waiting...");
    await yieldToMacrotasks();
}

function yieldToMacrotasks() {
  // return new Promise((resolve) => setTimeout(resolve, 50));
    return new Promise((ok,fail) => setTimeout(ok,0));
}

