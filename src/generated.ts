declare module 'vscode-framework' {
    interface RegularCommands {
        "runFile": true
    }
    interface Settings extends Required<Configuration> {}
}

interface Configuration {
    clearTerminal?: boolean;
    defaultExec?:   string;
    execMap?:       { [key: string]: string };
    /**
     * Set the executor by
     * [globs](https://code.visualstudio.com/api/references/vscode-api#GlobPattern)
     */
    executorMapByGlob?: { [key: string]: string };
    /**
     * Focus on editor whenever the file is run instead of terminal
     */
    focusOnEditor?:  boolean;
    installExecMap?: { [key: string]: string };
    saveFile?:       "all" | "disabled" | "onlyActive";
    terminalCwd?:    "file" | "workspace";
}

export {}
