import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { LoginComponent } from "./components/login/login.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { EmailsComponent } from "./components/emails/emails.component";
import { EventsComponent } from "./components/events/events.component";
import { TenantComponent } from "./components/tenant/tenant.component";
import { RegistrationComponent } from './components/registration/registration.component';
import { TenantRegistrationComponent } from './components/tenant-registration/tenant-registration.component';

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
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
