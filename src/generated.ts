declare module 'vscode-framework' {
    interface RegularCommands {
        "runFile": true
    }
    interface Settings extends Required<Configuration> {}
}

interface Configuration {
    clearTerminal?:     boolean;
    defaultExec?:       string;
    execMap?:           { [key: string]: string };
    executorMapByGlob?: { [key: string]: string };
    /**
     * Focus on editor whenever the file is run instead of terminal
     */
    focusOnEditor?: boolean;
    saveFile?:      "all" | "disabled" | "onlyActive";
    terminalCwd?:   "file" | "workspace";
}

export {}
