import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppService } from './app.service';

import { MenuItem } from 'primeng/api';
import { DOCUMENT } from '@angular/common';

interface Command {
  icon: string,
  command: string
}
interface LinkedTo {
  to: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('main')
  public mainElement;

  public busy = false;

  public linkedTos: LinkedTo[] = [
    { icon: 'pi pi-copy', to: 'Linked to Explorer' },
    { icon: 'pi pi-link', to: 'Follow Editor'}
  ]

  public selectedLinkedTos = [
    ...this.linkedTos
  ];

  public linkedWithExplorer = this.linkedTos[0];
  public linkedWithEditor = this.linkedTos[1];

  public fsPath = '';
  public fsPathParts: MenuItem[] = [];
  public breadcrumbs = [];

  public showBreadcrumbIcons = false;

  public actionMenuContextSibling: any;
  public actionMenu: MenuItem[];

  constructor(
    private translate: TranslateService,
    private appService: AppService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.translate.setDefaultLang('en');

    this.appService.message.subscribe((message: any) => {
      switch (message.command) {
        case 'colorTheme':
          this.adjustTheme();
          break;
        case 'breadcrumbs':
          if (this.isLinkedWithEditor) {
            this.showBreadcrumbIcons = message.showBreadcrumbIcons;
            this.busy = true;
            try {
              this.fsPath = message.fsPath;
              this.fsPathParts = [];

              this.breadcrumbs = message.breadcrumbs;
              this.breadcrumbs.forEach((breadcrumb) => {
                breadcrumb.siblings.forEach((sibling, index) => {
                  if (sibling.selected) {
                    breadcrumb.selectedSibling = sibling;
                  }
                  if (index === 0 && sibling.selected) {
                    const breadcrumbMenuItem: MenuItem = {
                      label: `${sibling.basename}`,
                      command: () => { this.open(sibling); },
                      state: { ...sibling }
                    };
                    if (this.showBreadcrumbIcons) {
                      breadcrumbMenuItem.icon = (sibling.fileType === 'folder' ? 'pi pi-folder-open p-mr-3' : 'pi pi-file p-mr-3');
                    }
                    this.fsPathParts.push(breadcrumbMenuItem);
                  }
                });
              });
              setTimeout(() => {
                this.mainElement.nativeElement.lastElementChild.scrollIntoView();
              }, 0);
            } finally {
              this.busy = false;
            }
          }
          break;
      }
    });
  }

  ngOnInit() {
    const owner = this;
    this.actionMenu = [
      {
        label: 'Copy Path',
        icon: 'pi pi-clone',
        command: ((event) => {
            this.appService.copyPath(owner.actionMenuContextSibling);
        })
      },
      {
        label: 'Desktop Terminal',
        icon: 'pi pi-external-link',
        command: ((event) => {
            this.appService.desktopTerminalAtPath(owner.actionMenuContextSibling);
        })
      },
      {
        label: 'Explorer',
        icon: 'pi pi-folder-open',
        command: ((event) => {
            this.appService.explorerPath(owner.actionMenuContextSibling);
        })
      },
      {
        label: 'Terminal',
        icon: 'pi pi-credit-card',
        command: ((event) => {
            this.appService.terminalAtPath(owner.actionMenuContextSibling);
        })
      }
    ];
  }

  ngAfterViewInit(): void {
    this.adjustTheme();
  }

  public linkeTosChanged(event) {
    if (this.isLinkedWithExplorer) {
      this.linkedWithExplorer.icon = 'pi pi-copy'
      this.linkedWithExplorer.to = 'Linked to Explorer'
    } else {
      this.linkedWithExplorer.icon = 'pi pi-lock';
      this.linkedWithExplorer.to = 'Not linked to Explorer'
    }
    if (this.isLinkedWithEditor) {
      this.linkedWithEditor.icon = 'pi pi-stop'
      this.linkedWithEditor.to = 'Follow Editor'
    } else {
      this.linkedWithEditor.icon = 'pi pi-lock';
      this.linkedWithEditor.to = 'Do not follow Editor'
    }
  }

  clearActionMenuContextSibling() {
    this.actionMenuContextSibling = undefined;
  }

  adjustTheme() {
    let theme = "md-light-indigo";
    if (document.body.classList.contains("vscode-light")) {
      theme = "md-light-indigo";
    } else if (document.body.classList.contains("vscode-dark")) {
      theme = "md-dark-indigo";
    }
    let themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
    if (themeLink) {
        themeLink.href = theme + '.css';
    }
  }

  get isLinkedWithExplorer() {
    return this.selectedLinkedTos.includes(this.linkedWithExplorer);
  }

  get isLinkedWithEditor() {
    return this.selectedLinkedTos.includes(this.linkedWithEditor);
  }

  open(breadcrumbItem, event?: MouseEvent) {
    this.fsPath = breadcrumbItem.path;
    this.appService.open(breadcrumbItem, this.isLinkedWithExplorer);
  }
}
