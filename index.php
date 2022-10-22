<!DOCTYPE html>
<?php header("Cross-Origin-Embedder-Policy: require-corp"); ?>
<?php header("Cross-Origin-Opener-Policy: same-origin"); ?>
<html lang="en">
    <head>
        <title>Python Graphics Example</title>
        <meta charset="utf-8">
        <link rel="stylesheet"
              href="https://fonts.googleapis.com/css2?family=Raleway">
        <link rel="stylesheet" href="css/site.css">
        <!--<script src="https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js"></script>-->
        <script type="module" src="js/site.js"></script>
    </head>
    <body onload="init_main()">
        <div class="main">
            <textarea id='code' rows="15" cols="80">
print('Hello, World!')
</textarea><br>
<button type="button" id="click-button" onclick="get_input()">Run</button>
<button type="button" id="click-button" onclick="reset_console()" style="margin-left: 10px; margin-right: 10px">Reset</button>
Examples:
<select name="examples" id="examples" onchange="update_terminal()">
  <option value="0">Hello World</option>
  <option value="1">User input</option>
  <option value="2">Triangle</option>
</select>
<p>
            <textarea id='console-output' rows="15" cols="80" readonly>
            </textarea>
        </div>
    </body>
</html>