const pyodideWorker = new Worker("./js/webworker.js");

const callbacks = {};

pyodideWorker.onmessage = (event) => {
    const { id, ...data } = event.data;
    if (event.data.outputText !== undefined) {
        console.log("received output:");
        console.log(event.data.outputText);
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

export { asyncRun, sendMessageToWorker, passSharedBuffer };
