import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { BasicAuthInterceptor } from './helpers/basic-auth.interceptor';
import { ErrorInterceptor } from './helpers/error.interceptor';
import { AuthGuard } from './helpers/auth.guard';
import { EventsComponent } from './views/events/events.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TenantComponent } from './views/tenant/tenant.component';
import { ErrorComponent } from './views/error/error.component';
import { RegistrationComponent } from './views/registration/registration.component';
import { TenantRegistrationComponent } from './views/tenant-registration/tenant-registration.component';
import { ImprintComponent } from './views/imprint/imprint.component';
import { ProfileComponent } from './views/profile/profile.component';
import { LegalComponent } from './views/legal/legal.component';
import { TenantGuard } from './helpers/tenant.guard';
import { ROLE } from '../../../common/tenant-relation';
import { CompleteRegistrationComponent } from './views/complete-registration/complete-registration.component';
import { PasswordResetComponent } from './views/password-reset/password-reset.component';
import { PasswordForgottenComponent } from './views/password-forgotten/password-forgotten.component';
import { ROUTES } from '../../../common/frontend.routes';
import { IntroComponent } from './views/intro/intro.component';
import { MyAccountsComponent } from './views/my-accounts/my-accounts.component';

const routes: Routes = [
  {
    path: ROUTES.HOME,
    component: IntroComponent,
  },
  {
    path: ROUTES.LOGIN,
    component: LoginComponent,
  },
  {
    path: ROUTES.REGISTER_TENANT,
    component: TenantRegistrationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ROUTES.PASSWORD_FORGOTTEN,
    component: PasswordForgottenComponent,
  },
  {
    path: ROUTES.PASSWORD_RESET,
    component: PasswordResetComponent,
  },
  {
    path: ROUTES.REGISTER_USER,
    component: RegistrationComponent,
  },
  {
    path: 'fehler/:errortype',
    component: ErrorComponent,
  },
  {
    path: ROUTES.IMPRINT,
    component: ImprintComponent,
  },
  {
    path: ROUTES.LEGAL,
    component: LegalComponent,
  },
  {
    path: ROUTES.REGISTER_USER_FINISH,
    component: CompleteRegistrationComponent,
  },
  {
    path: ROUTES.MY_TENANTS,
    component: MyAccountsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ROUTES.PROFILE,
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':tenantPath',
    children: [
      {
        path: ROUTES.LOGIN,
        component: LoginComponent,
      },
      {
        path: ROUTES.TENANT_PLANNER,
        component: DashboardComponent,
        canActivate: [AuthGuard, TenantGuard],
      },
      {
        path: ROUTES.TENANT_MANAGEMENT,
        component: TenantComponent,
        canActivate: [AuthGuard, TenantGuard],
        data: { role: ROLE.ADMIN },
      },
      {
        path: ROUTES.TENANT_EVENTS,
        component: EventsComponent,
      },
      {
        path: ROUTES.REGISTER_USER,
        component: RegistrationComponent,
      },
      {
        path: '**',
        redirectTo: ROUTES.TENANT_EVENTS,
      },
    ],
  },
  {
    path: '**',
    redirectTo: ROUTES.HOME,
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
