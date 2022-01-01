# Terminal Code Runner

This is extremely simplified and light version of [Code Runner](https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner) which supports running code only in terminal.

Why this instead not Code Runner:

- Uses different terminals for each file
- No [Conflict with Output Colorizer](https://github.com/formulahendry/vscode-code-runner/issues/59)
- [`preserveFocus` just works](https://github.com/formulahendry/vscode-code-runner/issues/715)

Note, this is a rewritten version of Code Runner from the ground, there is exec command for js langs (.ts, .tsx and js) only.
