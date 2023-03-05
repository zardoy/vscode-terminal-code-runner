/* eslint-disable no-template-curly-in-string, @typescript-eslint/no-explicit-any */

import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

import vscode, { Uri } from 'vscode'

/**
 * code migrated from: https://github.com/tjx666/open-in-external-app/blob/master/src/parseVariables.ts
 *
 * @see https://code.visualstudio.com/docs/editor/variables-reference
 */
export function parseVariables(str: string, activeFile: Uri) {
    str = str.replaceAll('$path', '${relativeFile}')

    const replacement: Map<string | RegExp, string | ((substring: string, ...args: any[]) => string) | undefined> = new Map([
        ['${userHome}', homedir()],
        ['${pathSeparator}', path.sep],
    ])

    const { workspaceFolders } = vscode.workspace

    const workspaceFolder = workspaceFolders?.[0]
    replacement.set('${workspaceFolder}', workspaceFolder?.uri.fsPath ?? '')
    replacement.set('${workspaceFolderBasename}', workspaceFolder?.name ?? '')

    const { activeTextEditor } = vscode.window
    const absoluteFilePath = activeFile.fsPath
    replacement.set('${file}', absoluteFilePath)

    const activeWorkspace = activeFile ? vscode.workspace.getWorkspaceFolder(activeFile) : undefined
    replacement.set('${fileWorkspaceFolder}', activeWorkspace?.uri.fsPath)
    replacement.set('${cwd}', activeWorkspace?.uri.fsPath)

    const relativeFilePath = activeWorkspace ? path.relative(activeWorkspace.uri.fsPath, absoluteFilePath) : absoluteFilePath
    replacement.set('${relativeFile}', relativeFilePath ?? absoluteFilePath)

    if (relativeFilePath) replacement.set('${relativeFileDirname}', relativeFilePath.slice(0, relativeFilePath.lastIndexOf(path.sep)))

    const parsedPath = path.parse(absoluteFilePath)
    replacement.set('${fileBasename}', parsedPath.base)
    replacement.set('${fileBasenameNoExtension}', parsedPath.name)
    replacement.set('${fileExtname}', parsedPath.ext)
    replacement.set('${fileDirname}', parsedPath.dir)

    if (activeTextEditor) {
        replacement.set('${lineNumber}', String(activeTextEditor.selection.start.line + 1))

        const cursorPosition = activeTextEditor.selection.active
        replacement.set('${cursorLineNumber}', String(cursorPosition.line + 1))
        replacement.set('${cursorColumnNumber}', String(cursorPosition.character + 1))

        replacement.set('${selectedText}', activeTextEditor.document.getText(activeTextEditor.selection))
    }

    replacement.set(/\${env:(.*?)}/g, (...captures) => process.env[captures[1]] ?? captures[0])
    replacement.set(/\${config:(.*?)}/g, (...captures) => vscode.workspace.getConfiguration().get(captures[1], captures[0]))

    const replacementEntries = [...replacement.entries()].filter(([_, r]) => r !== undefined)
    for (const [search, replacer] of replacementEntries) {
        const typeofReplacer = typeof replacer
        if (typeofReplacer === 'string') str = str.replaceAll(search, replacer as string)
        else if (typeofReplacer === 'function') str = str.replaceAll(search as RegExp, replacer as any)
    }

    return str
}
