import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

// import { BreadcrumbModule } from 'primeng/breadcrumb';
// import { ButtonModule } from 'primeng/button';
// import { CheckboxModule } from 'primeng/checkbox';
import { ContextMenuModule } from 'primeng/contextmenu';
// import { DialogModule } from 'primeng/dialog';
// import { DropdownModule } from 'primeng/dropdown';
// import { InputTextModule} from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { MenuModule } from 'primeng/menu';
// import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SelectButtonModule } from 'primeng/selectbutton';
// import { SplitButtonModule } from 'primeng/splitbutton';
// import { TableModule } from 'primeng/table';
// import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
// import { TooltipModule } from 'primeng/tooltip';
// import { TreeTableModule } from 'primeng/treetable';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppService } from './app.service';
import { AppComponent } from './app.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    // BreadcrumbModule,
    // ButtonModule,
    // CheckboxModule,
    ContextMenuModule,
    // DialogModule,
    // DropdownModule,
    // InputTextModule,
    ListboxModule,
    MenuModule,
    // OverlayPanelModule,
    SelectButtonModule,
    // SplitButtonModule,
    // TableModule,
    // ToggleButtonModule,
    ToolbarModule
    // TooltipModule,
    // TreeTableModule
  ],
  providers: [
    AppService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
