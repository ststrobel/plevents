import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmailsComponent } from './components/emails/emails.component';
import { EventsComponent } from './components/events/events.component';
import { TenantComponent } from './components/tenant/tenant.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { TenantRegistrationComponent } from './components/tenant-registration/tenant-registration.component';
import { ErrorComponent } from './components/error/error.component';
import { QuillModule } from 'ngx-quill';
import { EventSelectComponent } from './components/event-select/event-select.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ButtonsModule } from 'ngx-bootstrap/buttons';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    EmailsComponent,
    EventsComponent,
    TenantComponent,
    RegistrationComponent,
    TenantRegistrationComponent,
    ErrorComponent,
    EventSelectComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule.forRoot({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'], // toggled buttons
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
          [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
          [{ color: [] }, { background: [] }], // dropdown with defaults from theme
          [{ align: [] }],
          ['link'],
        ],
      },
      placeholder: 'Optionalen Text eingeben',
    }),
    NgbModule,
    BrowserAnimationsModule,
    ModalModule.forRoot(),
    ButtonsModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
