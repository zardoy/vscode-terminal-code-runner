declare module 'vscode-framework' {
    interface RegularCommands {
        "runFile": true
        "runWithSideCode": true
    }
    interface Settings extends Required<Configuration> {}
}

interface Configuration {
    clearTerminal?: boolean;
    defaultExec?:   string;
    execMap?:       { [key: string]: string };
    /**
     * Focus on editor whenever the file is run instead of terminal
     */
    focusOnEditor?:  boolean;
    installExecMap?: { [key: string]: string };
    saveFile?:       "all" | "disabled" | "onlyActive";
    terminalCwd?:    "file" | "workspace";
}

export {}
