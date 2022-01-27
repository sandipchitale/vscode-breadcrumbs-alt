import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';

class BreadcrumbsViewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'vscode-breadcrumbs-alt.breadcrumbs';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  fileType(fsPath: string): string {
    try {
      return fs.statSync(fsPath).isDirectory() ? 'folder' : 'file';
    } catch (e) {
      return 'file';
    }
  }

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.command) {
        case 'open':
          if (data.breadcrumbItem.fileType === 'file') {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(data.breadcrumbItem.path));
          } else {
            if (data.linkWithExplorer) {
              vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(data.breadcrumbItem.path));
            }
            this.setActiveTextEditorPath(data.breadcrumbItem.path);
          }
          break;
        case 'copyPath':
          _copy(data.breadcrumbItem.path);
          break;
        case 'explorerPath':
          _explorer(data.breadcrumbItem.path);
          break;
        case 'terminalAtPath':
          _terminal(data.breadcrumbItem.path);
          break;
        case 'desktopTerminalAtPath':
          _externalTerminal(data.breadcrumbItem.path);
          break;
      }
    });

    setTimeout(() => {
      activatedTextEditor(this, vscode.window.activeTextEditor);
    }, 0);
  }

  setColorTheme(colorTheme: vscode.ColorTheme) {
    this._view?.webview.postMessage({
      command: 'colorTheme',
      colorTheme
    });
  }

  setActiveTextEditorPath(fsPath?: string) {
    const breadcrumbs = [];
    if (fsPath) {
      let dirname = path.normalize(fsPath);
      let lastdirname;

      if (dirname !== path.dirname(dirname)) {
        if (this.fileType(dirname) === 'folder') {
          const siblings: any[] = fs.readdirSync(dirname).map((sibling) => {
            const absolutePath = path.join(dirname, sibling);
            return {
              basename: sibling,
              path: absolutePath,
              fileType: this.fileType(absolutePath),
              selected: false
            }
          });
          breadcrumbs.unshift({
            siblings
          });
        }
      }

      let breadcrumbFromWorkspaceRoot = vscode.workspace
        .getConfiguration('vscode-breadcrumbs-alt')
        .get<boolean>('breadcrumbFromWorkspaceRoot');
      let workspaceRoot;
      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
      } else {
        breadcrumbFromWorkspaceRoot = false;
      }

      while (true) {
        const basename = path.basename(dirname);
        dirname = path.dirname(dirname);
        if (dirname !== lastdirname) {
          const absolutePath = path.join(dirname, basename);
          const siblings: any[] = fs.readdirSync(dirname).map((sibling) => {
            const absolutePath = path.join(dirname, sibling);
            return {
              basename: sibling,
              path: absolutePath,
              fileType: this.fileType(absolutePath),
              selected: (basename === sibling)
            }
          });
          breadcrumbs.unshift({
            siblings
          });
          lastdirname = dirname;
        } else {
          breadcrumbs.unshift({
            siblings: [
              {
                basename: dirname,
                path: dirname,
                fileType: 'folder',
                selected: true
              }
            ]
          });
          break;
        }
        if (breadcrumbFromWorkspaceRoot && workspaceRoot && workspaceRoot === dirname) {
          break;
        }
      }

      breadcrumbs.forEach((breadcrumbLevel) => {
        const siblings = (breadcrumbLevel.siblings as any[]);
        if (siblings.length > 1) {
          const sibling = siblings.find((sibling) => {
            return sibling.selected;
          });
          if (sibling) {
            siblings.splice(siblings.indexOf(sibling), 1);
            siblings.unshift(sibling);
          }
        }
      });
    }
    this._view?.webview.postMessage({
      command: 'breadcrumbs',
      fsPath,
      breadcrumbs,
      showBreadcrumbIcons: vscode.workspace.getConfiguration('vscode-breadcrumbs-alt').get<boolean>('showBreadcrumbIcons')
    });
  }

  /**
   * Returns html of the start page (index.html)
   */
  private _getHtmlForWebview(webview: vscode.Webview) {
    // URI to dist folder
    const appDistUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist'));;

    // path as uri
    const baseUri = webview.asWebviewUri(appDistUri);

    // get path to index.html file from dist folder
    const indexPath = path.join(appDistUri.fsPath, 'index.html');

    // read index file from file system
    let indexHtml = fs.readFileSync(indexPath, { encoding: 'utf8' });

    // update the base URI tag
    indexHtml = indexHtml.replace('<base href="/">', `<base href="${String(baseUri)}/">`);

    return indexHtml;
  }
}

let extensionPath: string;

let outputChannel: vscode.OutputChannel;
let lastActiveTextEditor: vscode.TextEditor | undefined;
let lastNonNullAactiveTextEditor: vscode.TextEditor;

/**
 * Activates extension
 * @param context vscode extension context
 */
export function activate(context: vscode.ExtensionContext) {
  extensionPath = context.extensionPath;

  outputChannel = vscode.window.createOutputChannel(context.extension.id.replace('sandipchitale.', ''));

  const provider = new BreadcrumbsViewProvider(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(BreadcrumbsViewProvider.viewType, provider));

  vscode.window.onDidChangeActiveTextEditor((activeTextEditor) => {
    activatedTextEditor(provider, activeTextEditor);
  }, context, context.subscriptions);

  vscode.window.onDidChangeActiveColorTheme((colorTheme: vscode.ColorTheme) => {
    provider.setColorTheme(colorTheme);
  });
}

function activatedTextEditor(provider: BreadcrumbsViewProvider, activeTextEditor: vscode.TextEditor | undefined) {
  lastActiveTextEditor = activeTextEditor;
  if (activeTextEditor) {
    lastNonNullAactiveTextEditor = activeTextEditor;
    if (activeTextEditor.document.uri.scheme === 'file') {
      provider.setActiveTextEditorPath(activeTextEditor.document.uri.fsPath);
    }
  } else {
    provider.setActiveTextEditorPath(undefined);
  }
}

function _copy(fsPath: string) {
  vscode.env.clipboard.writeText(fsPath);
}

function _explorer(fsPath: string) {
  if (os.platform() === 'win32') {
      const explorerProcess = child_process.spawn(
        'cmd',
        [
            '/C'
            ,'start'
            ,'explorer'
            ,'/e'
            ,','
            ,'/select'
            ,','
            ,fsPath
        ]
      );

      explorerProcess.on('exit', (code) => {
      });
  } else if (os.platform() === 'linux') {
      const explorerProcess = child_process.spawn(
        '/usr/bin/nautilus',
        [
            fsPath
        ]
      );

      explorerProcess.on('exit', (code) => {
      });
  } else if (os.platform() === 'darwin') {
      const explorerProcess = child_process.spawn(
        '/usr/bin/open',
        [
            '-a'
            ,'/System/Library/CoreServices/Finder.app'
            ,fsPath
        ]
      );

      explorerProcess.on('exit', (code) => {
      });
  }
}

function _terminal(fsPath: string) {
  if (fs.statSync(fsPath).isFile()) {
      fsPath = path.dirname(fsPath);
  }

  const terminal = vscode.window.createTerminal({
      name: path.basename(fsPath),
      cwd: fsPath,
  });
  terminal.show();
}

function _externalTerminal(fsPath: string) {
  if (fs.statSync(fsPath).isFile()) {
      fsPath = path.dirname(fsPath);
  }

  if (os.platform() === 'win32') {
      const explorerProcess = child_process.spawn(
        'cmd',
        [
            '/K'
            ,'start'
            ,'cd'
            ,'/D'
            ,fsPath
        ]
      );
      explorerProcess.on('exit', (code) => {
      });
  } else if (os.platform() === 'linux') {
      const explorerProcess = child_process.spawn(
        'gnome-externalTerminal',
        [
            `--working-directory="${fsPath}"`
        ]
      );

      explorerProcess.on('exit', (code) => {
      });
  } else if (os.platform() === 'darwin') {
      const explorerProcess = child_process.spawn(
        '/usr/bin/osascript',
        [
            path.join(extensionPath, 'scripts', 'cdterminal.scpt')
            ,fsPath
        ]
      );

      explorerProcess.on('exit', (code) => {
      });
  }
}
