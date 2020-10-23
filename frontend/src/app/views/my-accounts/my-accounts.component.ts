import { Component, OnInit } from '@angular/core';
import { reject } from 'lodash';
import { Invitation } from 'src/app/models/invitation';
import { TenantRelation } from 'src/app/models/tenant-relation';
import { AppService } from 'src/app/services/app.service';
import { TenantService } from 'src/app/services/tenant.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-my-accounts',
  templateUrl: './my-accounts.component.html',
  styleUrls: ['./my-accounts.component.scss'],
})
export class MyAccountsComponent implements OnInit {
  tenantRelations: TenantRelation[] = null;
  invitations: Invitation[] = null;

  constructor(
    private tenantService: TenantService,
    private userService: UserService,
    private appService: AppService
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
    if (confirm('Möchten Sie sich wirklich von dieser Organisation trennen?')) {
      this.userService
        .removeFromTenant(tenantRelation.tenantId, tenantRelation.userId)
        .subscribe(
          () => {
            alert(
              'Sie haben sich von Organisation "' +
                tenantRelation.tenant.name +
                '" getrennt'
            );
            if (
              this.appService.getCurrentTenant() &&
              this.appService.getCurrentTenant().id === tenantRelation.tenantId
            ) {
              this.appService.setCurrentTenant(null);
            }
            this.tenantRelations = reject(this.tenantRelations, tenantRelation);
          },
          error => {
            if (error === 'Conflict') {
              alert(
                'Sie sind der einzige Administrator für diese Organisation und können sich daher nicht von ihr trennen'
              );
            } else {
              alert('Es trat ein Fehler auf');
            }
          }
        );
    }
  }

  join(invitation: Invitation): void {
    this.userService.acceptInvitation(invitation.id).subscribe(
      (tenantRelation: TenantRelation) => {
        this.loadTenantsAndInvitations();
        alert('Accout beigetreten');
      },
      error => {
        console.error(error);
        alert('Es trat ein Fehler auf');
      }
    );
  }

  decline(invitation: Invitation): void {
    if (confirm('Möchten Sie die Einladung wirklich ablehnen?')) {
      this.userService.declineInvitation(invitation.tenantId).subscribe(
        () => {
          alert('Einladung abgelehnt');
          this.invitations = reject(this.invitations, invitation);
        },
        error => {
          console.error(error);
          alert('Ein technischer Fehler ist aufgetreten');
        }
      );
    }
  }
}
