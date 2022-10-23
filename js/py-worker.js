const pyodideWorker = new Worker("./js/webworker.js");

const callbacks = {};

pyodideWorker.onmessage = (event) => {
    const { id, ...data } = event.data;
    if (event.data.outputText !== undefined) {
        // console.log(event.data.outputText);
        const terminal = document.getElementById('console-output');
        terminal.value += event.data.outputText;

        if (event.data.getInput !== undefined && event.data.getInput) {
            getInputFromTerminal();
            // use atomics to guarantee values are propogated
            // Atomics.store(window.sharedArr, 1, 100);
            // Atomics.store(window.sharedArr, 0, 1);
        }
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

const sendMessageToWorker = (message) => {
    // console.log("Sending ");
    // console.log({'control': true, "message": message}); 
    pyodideWorker.postMessage({'control': true, "message": message});
};

const passSharedBuffer = (buf) => {
    pyodideWorker.postMessage({'buffer': buf}); 
}

const asyncRun = ((script, context) => {
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
    const consoleListener = () => {
        console.log("got input");
        // first, check to see that the original text is still
        // present (otherwise, change back)
        const currentVal = terminal.value;
        if (!currentVal.startsWith(originalText)) {
            terminal.value = originalText + userInput;
        } else if (currentVal.endsWith('\n')) {
            console.log("Full input: " + userInput);
            terminal.removeEventListener('input', consoleListener);
        }
        else{
            userInput = currentVal.substring(originalText.length);
            console.log("User input so far: " + userInput);
        }
    }
}


export { asyncRun, sendMessageToWorker, passSharedBuffer };
