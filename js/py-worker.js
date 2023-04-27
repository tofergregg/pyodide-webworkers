import { updateCanvas } from "./drawing.js";

let pyodideWorker;
// remove: let interruptBuffer;
window.codeRunning = false;
const callbacks = {};

const interruptExecution = () => {
    // sometimes, the program does not handle the interrupt
    // so, we'll just keep trying to interrupt until we 
    // get confirmation that the program has stopped
    // Basically, we'll keep hitting ctrl-c until we stop the program!
    const sendInterrupt = setInterval(() => {
        if (!window.codeRunning) {
            clearInterval(sendInterrupt);
        } else {
            // remove: Atomics.store(interruptBuffer, 0, 2);
            // remove: Atomics.store(window.waitArr, 0, 1);
            // remove: Atomics.notify(window.waitArr, 0);
            window.stopExecution = true;
            const terminal = document.getElementById('console-output');
            terminal.removeEventListener('input', consoleListener);
        }
    }, 10);
}

const setupWorker = () => {
    pyodideWorker = new Worker("./js/webworker.js");
    // remove: const interruptBufferRaw = new SharedArrayBuffer(1);
    // remove: interruptBuffer = new Uint8Array(interruptBufferRaw);
    // remove: window.interruptBuffer = interruptBuffer;
    // remove: pyodideWorker.postMessage({cmd: "setInterruptBuffer", interruptBuffer: interruptBufferRaw});
    // remove: clearInterruptBuffer();

    window.pyodideWorker = pyodideWorker;

    pyodideWorker.onmessage = (event) => {
        const { id, ...data } = event.data;
        if (event.data.outputText !== undefined) {
            // console.log(event.data.outputText);
            const terminal = document.getElementById('console-output');
            terminal.value += event.data.outputText;
            terminal.blur();
            terminal.focus();

            if (event.data.getInput !== undefined && event.data.getInput) {
                getInputFromTerminal();
            }
            return;
        }
        if (event.data.cmd === 'updateCanvas') {
            updateCanvas(event.data.canvasCmd, event.data.dict);
            return;
        }

        if (event.data.cmd === 'getMousePos') {
            // need 2 bytes for each mouse x and y
            // will store in little endian format
            const lastX = window.lastMouse.x;
            const lastY = window.lastMouse.y;

            Atomics.store(window.sharedArr, 1, lastX % 256);
            Atomics.store(window.sharedArr, 2, Math.floor(lastX / 256));

            Atomics.store(window.sharedArr, 3, lastY % 256);
            Atomics.store(window.sharedArr, 4, Math.floor(lastY / 256));

            // alert the webworker
            Atomics.store(window.waitArr, 0, 1);
            Atomics.notify(window.waitArr, 0);
            return;
        }

        if (event.data.cmd === 'getMouseDownPos') {
            // need 2 bytes for each mouse x and y
            // will store in little endian format
            const lastX = window.lastMouseDown.x;
            const lastY = window.lastMouseDown.y;
            // update so we indicate that we've read it
            window.lastMouseDown.x = -1;
            window.lastMouseDown.y = -1;

            Atomics.store(window.sharedArr, 1, lastX % 256);
            Atomics.store(window.sharedArr, 2, Math.floor(lastX / 256));

            Atomics.store(window.sharedArr, 3, lastY % 256);
            Atomics.store(window.sharedArr, 4, Math.floor(lastY / 256));

            // alert the webworker
            Atomics.store(window.waitArr, 0, 1);
            Atomics.notify(window.waitArr, 0);
            return;
        }
        if (event.data.cmd === 'clearTerminal') {
            const terminal = document.getElementById('console-output');
            terminal.value = '';
            return;
        }
        window.codeRunning = false;
        const onSuccess = callbacks[id];
        delete callbacks[id];
        if (typeof(onSuccess) === 'function') {
            onSuccess(data);
        } else {
            console.log("Error: " + error);
        }
    };
}

const sendMessageToWorker = (message) => {
    // console.log("Sending ");
    // console.log({'control': true, "message": message}); 
    pyodideWorker.postMessage({'control': true, "message": message});
};

const passSharedBuffer = (buf, waitBuf) => {
    pyodideWorker.postMessage({'buffer': buf, 'waitBuffer': waitBuf}); 
}

const asyncRun = ((script, context) => {
    let id = 0; // identify a Promise
    return (script, context) => {
        // remove: clearInterruptBuffer();
        // the id could be generated more carefully
        id = (id + 1) % Number.MAX_SAFE_INTEGER;
        window.codeRunning = true;
        return new Promise((onSuccess) => {
            callbacks[id] = onSuccess;
            pyodideWorker.postMessage({
                ...context,
                python: script,
                id,
            });
        });
    };
})();

const consoleListener = () => {
    const terminal = document.getElementById('console-output');
    // first, check to see that the original text is still
    // present (otherwise, change back)
    const currentVal = terminal.value;
    if (!currentVal.startsWith(window.originalText)) {
        terminal.value = window.originalText + window.userInput;
    } else if (currentVal.endsWith('\n')) {
        terminal.removeEventListener('input', consoleListener);
        // we need to populate the shared buffer with the input
        // the first byte is going to be changed to 1 to indicate
        // that we have input (do this last)
        // The second and third bytes are going to be a little-endian
        // 2-byte number that represents the length of the input
        // The remaining bytes will represent the input characters
        // We can hold up to 65536-3 = 65533 bytes of data
        
        const inputLen = Math.min(window.userInput.length, 65533);

        // set the length
        Atomics.store(window.sharedArr, 1, inputLen % 256); 
        Atomics.store(window.sharedArr, 2, Math.floor(inputLen / 256)); 
        // copy the data
        for (let i = 0; i < inputLen; i++) {
            Atomics.store(window.sharedArr, i + 3, window.userInput.charCodeAt(i));
        }

        // alert the webworker
        Atomics.store(window.waitArr, 0, 1);
        Atomics.notify(window.waitArr, 0);
    }
    else{
        window.userInput = currentVal.substring(window.originalText.length);
    }
}

const getInputFromTerminal = () => {
    const terminal = document.getElementById('console-output');
    const end = terminal.value.length;

    terminal.setSelectionRange(end, end);
    terminal.focus();
    // we need to configure the textarea so that we can control how the user
    // changes it. I.e., only allow text after the current text
    // get the current text in the textarea so we have it when there are changes
    window.originalText = terminal.value;
    window.userInput = '';
    terminal.addEventListener('input', consoleListener, false);
}

export { setupWorker, asyncRun, sendMessageToWorker, interruptExecution  };
