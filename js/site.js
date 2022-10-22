import { asyncRun } from "./py-worker";

const script = `
    import time
    from js import sleep_fixed
    time.sleep = sleep_fixed
    import statistics
    from js import A_rank
    a = input("hello?")
    # statistics.stdev(A_rank)
    b = time.sleep(5);
    print(b)
`;

const context = {
  A_rank: [0.8, 0.4, 1.2, 3.7, 2.6, 5.8],
};

const init_main = () => {
//    window.pyodide_ready = false;
//    start_pyodide();
    main();

}

window.init_main = init_main;


async function main() {
  try {
    const { results, error } = await asyncRun(script, context);
    if (results) {
      console.log("pyodideWorker return results: ", results);
    } else if (error) {
      console.log("pyodideWorker error: ", error);
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

const get_input = () => {
    code = document.getElementById('code').value;
    window.pyodide.runPython(code);
}

const reset_console = () => {
    document.getElementById('console-output').value = ''
    
}

const update_terminal = () => {
    const snippets = [`print('Hello, World!')`,

        `first_number = int(input("Please type a number: "))
print(f"{first_number}")
second_number = int(input("Please type another number: "))
print(f"{second_number}")
result = first_number + second_number
print(f"The sum of {first_number} + {second_number} = {result}")`,

        `def main():
    size = int(input("Size of triangle (5-21)? "))
    print(size)
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
    ]

    value = document.getElementById('examples').value;
    console = document.getElementById('code');
    console.value = snippets[value]; 
}

