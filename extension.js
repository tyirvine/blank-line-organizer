const { EOL } = require('os')
const vscode = require('vscode')
let config = {}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    // initialize configuration
    await readConfig()

    // reload configuration on change
    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('blankLine')) {
            await readConfig()
        }
    })

    context.subscriptions.push(
        vscode.commands.registerCommand('blankLine.process', (e) => applyReplacements())
    )
}

async function readConfig() {
    return config = await vscode.workspace.getConfiguration('blankLine')
}

async function applyReplacements() {
    let editor = vscode.window.activeTextEditor
    let doc = editor.document

    let range = new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(doc.lineCount, 0)
    )
    let txt = doc.getText()

    if (isValidLanguage(doc.languageId)) {
        return editor.edit(
            (edit) => edit.replace(
                range,
                replaceTxt(txt, new RegExp(`^${EOL}{2,}`, 'm'), true)
            ),
            { undoStopBefore: false, undoStopAfter: false }
        ).then(() => {
            // empty space + new line
            txt = vscode.window.activeTextEditor.document.getText()

            editor.edit(
                (edit) => edit.replace(
                    range,
                    replaceTxt(txt, new RegExp(`^ {2,}${EOL}`, 'gm'), true, true)
                ),
                { undoStopBefore: false, undoStopAfter: false }
            ).then(() => {
                // consecutive lines
                txt = vscode.window.activeTextEditor.document.getText()

                editor.edit(
                    (edit) => edit.replace(
                        range,
                        replaceTxt(txt, new RegExp(`${EOL}{3,}`, 'gm'))
                    ),
                    { undoStopBefore: false, undoStopAfter: false }
                )
            })
        })
    }
}

function isValidLanguage(languageId) {
    let langIds = config.languageIds

    // for all
    if (langIds.length) {
        if (langIds[0] == '*') {
            return true
        }

        return langIds.some((id) => id.toLowerCase() === languageId.toLowerCase())
    }

    return false
}

function replaceTxt(txt, regex, all = false, addNewLine = false) {
    return all
        ? txt.replace(regex, addNewLine ? EOL : '')
        : txt.replace(regex, config.keepOneEmptyLine ? `${EOL}${EOL}` : EOL)
}

exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}
