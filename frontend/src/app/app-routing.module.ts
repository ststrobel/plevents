import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BasicAuthInterceptor } from './helpers/basic-auth.interceptor';
import { ErrorInterceptor } from './helpers/error.interceptor';
import { AuthGuard } from './helpers/auth.guard';
import { EventsComponent } from './components/events/events.component';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TenantComponent } from './components/tenant/tenant.component';
import { ErrorComponent } from './components/error/error.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { TenantRegistrationComponent } from './components/tenant-registration/tenant-registration.component';
import { ImprintComponent } from './components/imprint/imprint.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LegalComponent } from './components/legal/legal.component';
import { TenantGuard } from './helpers/tenant.guard';
import { ROLE } from '../../../common/tenant-relation';

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
