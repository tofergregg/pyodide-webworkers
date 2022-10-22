const pyodideWorker = new Worker("./js/webworker.js");

const callbacks = {};

pyodideWorker.onmessage = (event) => {
    const { id, ...data } = event.data;
    const onSuccess = callbacks[id];
    console.log("onSuccess:");
    console.log(onSuccess);
    delete callbacks[id];
    onSuccess(data);
};

const sendMessageToWorker = (message) => {
    console.log("Sending " + {'control': true, "message": message}); 
    pyodideWorker.postMessage({'control': true, "message": message});
};

const asyncRun = (() => {
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

export { asyncRun, sendMessageToWorker };
