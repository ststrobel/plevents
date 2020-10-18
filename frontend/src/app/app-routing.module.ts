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

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'account-registrierung',
    component: TenantRegistrationComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'passwort-vergessen',
    component: PasswordForgottenComponent,
  },
  {
    path: 'passwort-reset',
    component: PasswordResetComponent,
  },
  {
    path: 'nutzer-registrierung',
    component: RegistrationComponent,
  },
  {
    path: 'fehler/:errortype',
    component: ErrorComponent,
  },
  {
    path: 'impressum',
    component: ImprintComponent,
  },
  {
    path: 'rechtliches',
    component: LegalComponent,
  },
  {
    path: 'registrierung',
    component: CompleteRegistrationComponent,
  },
  {
    path: 'profil',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':tenantPath',
    children: [
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard, TenantGuard],
      },
      {
        path: 'verwaltung',
        component: TenantComponent,
        canActivate: [AuthGuard, TenantGuard],
        data: { role: ROLE.ADMIN },
      },
      {
        path: 'events',
        component: EventsComponent,
      },
      {
        path: 'nutzer-registrierung',
        component: RegistrationComponent,
      },
      {
        path: '**',
        redirectTo: 'events',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
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
