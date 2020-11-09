import { Component, OnInit } from '@angular/core';
import { reject } from 'lodash';
import { Invitation } from 'src/app/models/invitation';
import { TenantRelation } from 'src/app/models/tenant-relation';
import { AppService } from 'src/app/services/app.service';
import { NotificationService } from 'src/app/services/notification.service';
import { TenantService } from 'src/app/services/tenant.service';
import { UserService } from 'src/app/services/user.service';
import { ROUTES } from '../../../../../common/frontend.routes';

@Component({
  selector: 'app-my-accounts',
  templateUrl: './my-accounts.component.html',
  styleUrls: ['./my-accounts.component.scss'],
})
export class MyAccountsComponent implements OnInit {
  tenantRelations: TenantRelation[] = null;
  invitations: Invitation[] = null;
  ROUTES = ROUTES;

  constructor(
    private tenantService: TenantService,
    private userService: UserService,
    private appService: AppService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadTenantsAndInvitations();
  }

  loadTenantsAndInvitations(): void {
    this.tenantRelations = null;
    this.invitations = null;
    this.tenantService
      .getAll()
      .subscribe((tenantRelations: TenantRelation[]) => {
        this.tenantRelations = tenantRelations;
      });
    this.userService
      .getPendingInvitations()
      .subscribe((invitations: Invitation[]) => {
        this.invitations = invitations;
      });
  }

  detach(tenantRelation: TenantRelation): void {
    this.notification.confirm({
      title: 'Von Organisation trennen?',
      text: 'Möchten Sie sich wirklich von dieser Organisation trennen?',
      yesButtonClass: 'btn-danger',
      yesButtonText: 'Ja',
      yesCallback: () => {
        this.userService
          .removeFromTenant(tenantRelation.tenantId, tenantRelation.userId)
          .subscribe(
            () => {
              this.notification.success(
                'Sie haben sich von Organisation "' +
                  tenantRelation.tenant.name +
                  '" getrennt'
              );
              if (
                this.appService.getCurrentTenant() &&
                this.appService.getCurrentTenant().id ===
                  tenantRelation.tenantId
              ) {
                this.appService.setCurrentTenant(null);
              }
              this.tenantRelations = reject(
                this.tenantRelations,
                tenantRelation
              );
            },
            error => {
              if (error === 'Conflict') {
                this.notification.success(
                  'Sie sind der einzige Administrator für diese Organisation und können sich daher nicht von ihr trennen'
                );
              } else {
                this.notification.error('Es trat ein Fehler auf');
              }
            }
          );
      },
    });
  }

  join(invitation: Invitation): void {
    this.userService.acceptInvitation(invitation.id).subscribe(
      (tenantRelation: TenantRelation) => {
        this.loadTenantsAndInvitations();
        this.notification.success('Accout beigetreten');
      },
      error => {
        console.error(error);
        this.notification.error('Es trat ein Fehler auf');
      }
    );
  }

  decline(invitation: Invitation): void {
    this.notification.confirm({
      title: 'Einladung ablehnen?',
      text: 'Möchten Sie die Einladung wirklich ablehnen?',
      yesButtonClass: 'btn-danger',
      yesButtonText: 'Ja',
      yesCallback: () => {
        this.userService.declineInvitation(invitation.tenantId).subscribe(
          () => {
            this.notification.success('Einladung abgelehnt');
            this.invitations = reject(this.invitations, invitation);
          },
          error => {
            console.error(error);
            this.notification.error('Es trat ein Fehler auf');
          }
        );
      },
    });
  }
}
