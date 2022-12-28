Instructions for bundling CodeMirror 6 code editor from here:

https://codemirror.net/examples/bundle/

Must run this each time to bundle:

```
node_modules/.bin/rollup editor.mjs -f iife -o editor.bundle.js -p @rollup/plugin-node-resolve
```

For new modules (ex.):
```
npm i codemirror @codemirror/lang-python
npm i rollup @rollup/plugin-node-resolve
```

Good ref: https://www.raresportan.com/how-to-make-a-code-editor-with-codemirror6


