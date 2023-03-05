import { dirname, basename } from 'node:path'
import * as vscode from 'vscode'
import { getExtensionSetting, registerExtensionCommand } from 'vscode-framework'
import { parseVariables } from './utils'

export const activate = () => {
    type FsPath = string
    const activeTerminals = new Map<FsPath, vscode.Terminal>()

    const checkDisplayRunButton = (textEditor: vscode.TextEditor | undefined): void => {
        void vscode.commands.executeCommand('setContext', `terminal-code-runner.runButton`, getHasExec(textEditor))
    }

    vscode.window.onDidChangeActiveTextEditor(checkDisplayRunButton)
    checkDisplayRunButton(vscode.window.activeTextEditor)

    registerExtensionCommand('runFile', async () => {
        const activeEditor = vscode.window.activeTextEditor
        if (!activeEditor || activeEditor.viewColumn === undefined) return

        let exec = getExec(activeEditor)
        if (!exec) {
            void vscode.window.showWarningMessage(`No matched exec command!`)
            return
        }

        const { document } = activeEditor
        const { fsPath } = document.uri
        const fileDir = dirname(fsPath)
        const fileName = basename(fsPath)
        exec = parseVariables(exec, document.uri)

        // Uses different terminals for each file
        const isDifferentTerminalsForEachFile = getExtensionSetting('differentTerminalsForEachFile')
        const terminalKey = isDifferentTerminalsForEachFile ? fsPath : '--Reused Terminal--'
        const terminalName = isDifferentTerminalsForEachFile ? `Runner: ${fileName}` : `Run Code`
        const terminal =
            activeTerminals.get(terminalKey) ??
            vscode.window.createTerminal({
                name: terminalName,
                cwd: getExtensionSetting('terminalCwd') === 'file' ? fileDir : undefined,
            })
        terminal.show()

        // https://github.com/formulahendry/vscode-code-runner/issues/715
        if (getExtensionSetting('focusOnEditor'))
            setTimeout(() => {
                void vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup')
            }, 150)

        // save file
        const saveFileSetting = getExtensionSetting('saveFile')
        if (saveFileSetting === 'all') await vscode.commands.executeCommand('workbench.action.files.saveAll')
        if (saveFileSetting === 'onlyActive') await vscode.commands.executeCommand('workbench.action.files.save')

        // run
        terminal.sendText(exec)

        // clear terminal
        if (getExtensionSetting('clearTerminal')) await vscode.commands.executeCommand('workbench.action.terminal.clear')

        activeTerminals.set(terminalKey, terminal)
    })

    vscode.window.onDidCloseTerminal(hiddenTerminal => {
        for (const [fsPath, terminal] of activeTerminals.entries())
            if (hiddenTerminal === terminal) {
                activeTerminals.delete(fsPath)
                break
            }
    })
}

const getExecByGlob = (doc: vscode.TextDocument) => {
    const globMap = getExtensionSetting('executorMapByGlob')
    for (const pattern of Object.keys(globMap)) if (vscode.languages.match({ pattern }, doc)) return globMap[pattern]
    return undefined
}

const getExecByLanguageId = (languageId: string) => {
    const execMap = getExtensionSetting('execMap')
    return execMap[languageId]
}

const getHasExec = (textEditor: vscode.TextEditor | undefined) => {
    if (!textEditor || textEditor.viewColumn === undefined) return false
    return Boolean(getExtensionSetting('defaultExec') ?? getExecByGlob(textEditor.document) ?? getExecByLanguageId(textEditor.document.languageId))
}

const getExec = (textEditor: vscode.TextEditor | undefined) => {
    if (!textEditor || textEditor.viewColumn === undefined) return
    return getExecByGlob(textEditor.document) ?? getExecByLanguageId(textEditor.document.languageId) ?? getExtensionSetting('defaultExec')
}
