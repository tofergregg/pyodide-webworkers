import {basicSetup, EditorView} from "codemirror"
import {python} from "@codemirror/lang-python"
import {EditorState} from "@codemirror/state"
import {autocompletion} from "@codemirror/autocomplete"
import {indentUnit} from "@codemirror/language"

let editorTheme = EditorView.theme(
    {  '&': { maxHeight: '200px' },
        '.cm-gutter,.cm-content': { minHeight: '100px' },
        '.cm-scroller': { overflow: 'auto' },
    });

let editor = new EditorView({
    extensions: [
        basicSetup, 
        python(),
        autocompletion({activateOnTyping: false}),
        indentUnit.of("    "),
        editorTheme,
    ],
    parent: document.getElementById('editor')
})

window.cmEditor = editor;
