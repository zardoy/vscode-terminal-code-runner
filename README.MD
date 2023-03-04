# Terminal Code Runner

This is extremely simplified and light version of [Code Runner](https://marketplace.visualstudio.com/items?itemName=formulahendry.code-runner) which supports running code only in terminal.

Why this instead of Code Runner:

- Support use different terminals for each file
- No [Conflict with Output Colorizer](https://github.com/formulahendry/vscode-code-runner/issues/59)
- [`preserveFocus` just works](https://github.com/formulahendry/vscode-code-runner/issues/715)

## Configuration

Note, this is a completely different version. By default, this extension only support run `javascript` file. You can configure it to support other languages:

```jsonc
{
    "terminalCodeRunner.execMap": {
        // default
        "javascript": "node ${relativeFile}",

        // support run typescript file
        // note: you need to install tsx by yourself, like npm install -g tsx
        "typescript": "tsx ${relativeFile}"
    }
}
```

You can also configure the executed command by [globs](https://code.visualstudio.com/api/references/vscode-api#GlobPattern):

```jsonc
{
    "terminalCodeRunner.executorMapByGlob": {
        // $relativeFile is VSCode variables, will fallback to file absolute path if no workspace opened
        // check all variables here: https://code.visualstudio.com/docs/editor/variables-reference
        "**/*.scpt": "osascript ${relativeFile}"
    }
}
```
