import { drawShape } from "./drawing.js";

const sendMessageToWorker = (message) => {
    // console.log("Sending ");
    // console.log({'control': true, "message": message}); 
    pyodideWorker.postMessage({'control': true, "message": message});
};

const passSharedBuffer = (buf) => {
    pyodideWorker.postMessage({'buffer': buf}); 
}

const asyncRun = ((script, context) => {
const pyodideWorker = new Worker("./js/webworker.js");

const callbacks = {};

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
    if (event.data.drawShape !== undefined) {
        drawShape(...event.data.shapeArgs);
        return;
    }
    const onSuccess = callbacks[id];
    delete callbacks[id];
    if (typeof(onSuccess) === 'function') {
        onSuccess(data);
    } else {
        console.log("Error: " + error);
    }
};
    let id = 0; // identify a Promise
    return (script, context) => {
        // the id could be generated more carefully
        id = (id + 1) % Number.MAX_SAFE_INTEGER;
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

const getInputFromTerminal = () => {
    const consoleListener = () => {
        // first, check to see that the original text is still
        // present (otherwise, change back)
        const currentVal = terminal.value;
        if (!currentVal.startsWith(originalText)) {
            terminal.value = originalText + userInput;
        } else if (currentVal.endsWith('\n')) {
            terminal.removeEventListener('input', consoleListener);
            // we need to populate the shared buffer with the input
            // the first byte is going to be changed to 1 to indicate
            // that we have input (do this last)
            // The second and third bytes are going to be a little-endian
            // 2-byte number that represents the length of the input
            // The remaining bytes will represent the input characters
            // We can hold up to 65536-3 = 65533 bytes of data
            
            const inputLen = Math.min(userInput.length, 65533);

            // set the length
            Atomics.store(window.sharedArr, 1, inputLen % 256); 
            Atomics.store(window.sharedArr, 2, Math.floor(inputLen / 256)); 
            // copy the data
            for (let i = 0; i < inputLen; i++) {
                Atomics.store(window.sharedArr, i + 3, userInput.charCodeAt(i));
            }

            // alert the webworker
            Atomics.store(window.sharedArr, 0, 1);
        }
        else{
            userInput = currentVal.substring(originalText.length);
        }
    }
    const terminal = document.getElementById('console-output');
    const end = terminal.value.length;

    terminal.setSelectionRange(end, end);
    terminal.focus();
    // we need to configure the textarea so that we can control how the user
    // changes it. I.e., only allow text after the current text
    // get the current text in the textarea so we have it when there are changes
    let originalText = terminal.value;
    let userInput = '';
    terminal.addEventListener('input', consoleListener, false);
}


export { asyncRun, sendMessageToWorker, passSharedBuffer };
