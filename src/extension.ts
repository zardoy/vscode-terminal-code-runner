import { dirname, basename } from 'path'
import * as vscode from 'vscode'
import ansiEscapes from 'ansi-escapes'
import { getExtensionSetting, registerExtensionCommand } from 'vscode-framework'
import { jsLangs } from './util'

export const activate = () => {
    // registerExtensionCommand('runWithSideCode', async () => {
    //     const activeEditor = vscode.window.activeTextEditor
    //     if (!activeEditor || activeEditor.viewColumn === undefined) return
    //     await vscode.window.showTextDocument(vscode.Uri.parse(`${documentScheme}:${activeEditor.document.uri.toString(true)}`), {
    //         preview: false,
    //         viewColumn: vscode.ViewColumn.Beside,
    //     })
    // })
    type FsPath = string
    const activeTerminals = new Map<FsPath, vscode.Terminal>()

    const checkRunButton = (textEditor: vscode.TextEditor | undefined): void => {
        if (!textEditor || textEditor.viewColumn === undefined) return
        let hasExec = !!getExtensionSetting('defaultExec')
        if (!hasExec) hasExec = !!getExec(textEditor.document.languageId)
        void vscode.commands.executeCommand('setContext', `terminal-code-runner.runBututon`, hasExec)
    }

    vscode.window.onDidChangeActiveTextEditor(checkRunButton)
    checkRunButton(vscode.window.activeTextEditor)

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
                // pty: {
                //     onDidWrite: writeEmitter.event,
                //     open: () => writeEmitter.fire('Type and press enter to echo the text\r\n\r\n'),
                //     close: () => {},
                //     handleInput: (data: string) => {
                //         // https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797#general-ascii-codes
                //         const codes = {
                //             backspace: 127,
                //             //
                //             ctrlBackspace: 23,
                //             del: 27,
                //         }
                //         if (data.codePointAt(0) === 127) {
                //             // backspace
                //             writeEmitter.fire(`\b${ansiEscapes.eraseEndLine}`)
                //             return
                //         }

                //         if (data === '\r') {
                //             writeEmitter.fire(`\r\necho: "${line}"\r\n\n`)
                //             line = ''
                //         } else {
                //             console.log('data', data.codePointAt(0))
                //             line += data
                //             writeEmitter.fire(data)
                //         }
                //     },
                // },
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
