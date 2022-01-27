import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  vscode: any;
  _message = new Subject();

  constructor() {
    this.vscode = window['acquireVsCodeApi']();

    window.addEventListener('message', event => {
      const message = event.data; // The JSON data our extension sent
      this._message.next(message);
    });
  }

  get message() {
    return this._message.asObservable();
  }

  open(breadcrumbItem, linkWithExplorer) {
    this.vscode.postMessage({
      command: 'open',
      breadcrumbItem,
      linkWithExplorer
    });
  }

  copyPath(breadcrumbItem) {
    this.vscode.postMessage({
      command: 'copyPath',
      breadcrumbItem
    });
  }

  desktopTerminalAtPath(breadcrumbItem) {
    this.vscode.postMessage({
      command: 'desktopTerminalAtPath',
      breadcrumbItem
    });
  }

  explorerPath(breadcrumbItem) {
    this.vscode.postMessage({
      command: 'explorerPath',
      breadcrumbItem
    });
  }

  terminalAtPath(breadcrumbItem) {
    this.vscode.postMessage({
      command: 'terminalAtPath',
      breadcrumbItem
    });
  }

}
