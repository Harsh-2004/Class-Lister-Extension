const vscode = require('vscode');
const ts = require('typescript');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Class List Extension is now active!');

    let disposable = vscode.commands.registerCommand('classList.showClasses', function () {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const fileContent = document.getText();
            const classList = getClassList(fileContent);

            vscode.window.showInformationMessage(`Classes: ${classList.join(', ')}`);
        }
    });

    context.subscriptions.push(disposable);

    const classListProvider = new ClassListProvider();
    vscode.window.registerTreeDataProvider('classListView', classListProvider);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === vscode.window.activeTextEditor.document) {
            classListProvider.refresh();
        }
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            classListProvider.refresh();
        }
    });
}

class ClassListProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return Promise.resolve([]);
        }

        const document = editor.document;
        const fileContent = document.getText();
        const classList = getClassList(fileContent);

        return Promise.resolve(classList.map(className => new ClassItem(className)));
    }
}

class ClassItem extends vscode.TreeItem {
    constructor(label) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
    }
}

function getClassList(content) {
    const sourceFile = ts.createSourceFile('tempFile.ts', content, ts.ScriptTarget.Latest, true);
    const classList = [];

    function visit(node) {
        if (ts.isClassDeclaration(node) && node.name) {
            classList.push(node.name.text);
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return classList;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};

