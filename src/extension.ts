import { dirname, basename } from 'path'
import * as vscode from 'vscode'
import { getExtensionSetting, registerExtensionCommand, } from 'vscode-framework'
import { jsLangs } from './util'

export const activate = () => {
    type FsPath = string
    const activeTerminals = new Map<FsPath, vscode.Terminal>()

    const checkDisplayRunButton = (textEditor: vscode.TextEditor | undefined): void => {
        if (!textEditor || textEditor.viewColumn === undefined) return
        let hasExec = !!getExtensionSetting('defaultExec')
        if (!hasExec) hasExec = !!getExec(textEditor.document.languageId)
        void vscode.commands.executeCommand('setContext', `terminal-code-runner.runButton`, hasExec)
    }

    vscode.window.onDidChangeActiveTextEditor(checkDisplayRunButton)
    checkDisplayRunButton(vscode.window.activeTextEditor)

    registerExtensionCommand('runFile', async () => {
        const activeEditor = vscode.window.activeTextEditor
        if (!activeEditor || activeEditor.viewColumn === undefined) return
        const { document } = activeEditor
        const { fsPath } = document.uri
        const fileDir = dirname(fsPath)
        const fileName = basename(fsPath)
        const workspaceRoot = vscode.workspace.getWorkspaceFolder(document.uri)
        const exec = (getExec(document.languageId) ?? getExtensionSetting('defaultExec'))
            ?.replace(/\$workspaceRoot/g, workspaceRoot?.uri.fsPath ?? '')
            .replace(/\$fileName/, fileName)
            .replace(/\$dir/, fileDir)
            .replace(/\$path/, fsPath)
        if (!exec) {
            void vscode.window.showWarningMessage(`No exec command for language ${document.languageId} is set`)
            return
        }

        const writeEmitter = new vscode.EventEmitter<string>()
        const line = ''
        const terminal =
            activeTerminals.get(fsPath) ??
            vscode.window.createTerminal({
                name: `Runner: ${fileName}`,
                cwd: getExtensionSetting('terminalCwd') === 'file' ? fileDir : undefined,
            })
        // vscode will never fix this arg
        terminal.show()
        if (getExtensionSetting('focusOnEditor'))
            setTimeout(() => {
                void vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup')
            }, 150)    
        const saveFileSetting = getExtensionSetting('saveFile')
        if (saveFileSetting === 'all') await vscode.commands.executeCommand('workbench.action.files.saveAll')
        if (saveFileSetting === 'onlyActive') await vscode.commands.executeCommand('workbench.action.files.save')

        terminal.sendText(exec)
        if (getExtensionSetting('clearTerminal')) await vscode.commands.executeCommand('workbench.action.terminal.clear')
        activeTerminals.set(fsPath, terminal)
    })

    vscode.window.onDidCloseTerminal(hiddenTerminal => {
        for (const [fsPath, terminal] of activeTerminals.entries())
            if (hiddenTerminal === terminal) {
                activeTerminals.delete(fsPath)
                break
            }
    })
}

const getExec = (languageId: string) => {
    const map = getExtensionSetting('execMap')
    let execString = map[languageId]
    if (!execString && jsLangs.includes(languageId)) execString = map.js
    return execString
}
