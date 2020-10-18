import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { EventsComponent } from './views/events/events.component';
import { TenantComponent } from './views/tenant/tenant.component';
import { RegistrationComponent } from './views/registration/registration.component';
import { TenantRegistrationComponent } from './views/tenant-registration/tenant-registration.component';
import { ErrorComponent } from './views/error/error.component';
import { QuillModule } from 'ngx-quill';
import { EventSelectComponent } from './views/event-select/event-select.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { ImprintComponent } from './views/imprint/imprint.component';
import { ProfileComponent } from './views/profile/profile.component';
import { LegalComponent } from './views/legal/legal.component';
import { ColorPickerModule } from 'ngx-color-picker';
import {
  NgcCookieConsentModule,
  NgcCookieConsentConfig,
} from 'ngx-cookieconsent';
import { environment } from 'src/environments/environment';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { CompleteRegistrationComponent } from './views/complete-registration/complete-registration.component';
import { PasswordResetComponent } from './views/password-reset/password-reset.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { PasswordForgottenComponent } from './views/password-forgotten/password-forgotten.component';

const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    domain: environment.domain,
  },
  position: 'bottom',
  theme: 'classic',
  palette: {
    popup: {
      background: '#000000',
      text: '#ffffff',
      link: '#ffffff',
    },
    button: {
      background: '#f1d600',
      text: '#000000',
      border: 'transparent',
    },
  },
  type: 'info',
  content: {
    message:
      'Diese Seite nutzt Cookies, um die korrekte Funktionsweise der Anwendung sicherzustellen. Es findet kein Tracking statt, persönliche Informationen bleiben rein auf diesem Gerät.',
    dismiss: 'Verstanden, Cookies zulassen',
    link: '',
  },
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    EventsComponent,
    TenantComponent,
    RegistrationComponent,
    TenantRegistrationComponent,
    ErrorComponent,
    EventSelectComponent,
    ImprintComponent,
    ProfileComponent,
    LegalComponent,
    CategoryManagementComponent,
    CompleteRegistrationComponent,
    PasswordResetComponent,
    UserManagementComponent,
    PasswordForgottenComponent,
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
    NgcCookieConsentModule.forRoot(cookieConfig),
    ColorPickerModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
