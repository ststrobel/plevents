import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { LoginComponent } from "./components/login/login.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { BasicAuthInterceptor } from "./helpers/basic-auth.interceptor";
import { ErrorInterceptor } from "./helpers/error.interceptor";
import { AuthGuard } from "./helpers/auth.guard";
import { EmailsComponent } from "./components/emails/emails.component";
import { EventsComponent } from "./components/events/events.component";

const routes: Routes = [
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "emails",
    component: EmailsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "events",
    component: EventsComponent,
  },
  {
    path: "**",
    redirectTo: "dashboard",
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: BasicAuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
})
export class AppRoutingModule {}
