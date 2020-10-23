import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { reject, findIndex, find } from 'lodash';
import { Invitation } from 'src/app/models/invitation';
import { Tenant } from 'src/app/models/tenant';
import { TenantRelation } from 'src/app/models/tenant-relation';
import { User } from 'src/app/models/user';
import { AppService } from 'src/app/services/app.service';
import { TenantService } from 'src/app/services/tenant.service';
import { UserService } from 'src/app/services/user.service';
import { ROUTES } from '../../../../../common/frontend.routes';
import { ROLE } from '../../../../../common/tenant-relation';

@Component({
  selector: 'user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  ROLE = ROLE;
  inviteAdminForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  tenantUserRelations: TenantRelation[] = new Array<TenantRelation>();
  @Input()
  tenant: Tenant;
  invitations: Invitation[];
  invitedUser: string = null;
  userExists: string = null;

  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private appService: AppService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // load users for this tenant
    this.tenantService
      .getUsers(this.tenant.id)
      .subscribe((relations: TenantRelation[]) => {
        this.tenantUserRelations = relations;
      });
    if (this.appService.hasRole(this.tenant.id, ROLE.OWNER)) {
      this.tenantService
        .getOpenInvitations(this.tenant.id)
        .subscribe((invitations: Invitation[]) => {
          this.invitations = invitations;
        });
    } else {
      this.invitations = null;
    }
  }

  activate(user: User): void {
    this.userService
      .activate(this.tenant.id, user.id)
      .subscribe((activatedUser: User) => {
        const index = findIndex(this.tenantUserRelations, { userId: user.id });
        this.tenantUserRelations[index].active = true;
      });
  }

  inviteNewAdmin(): void {
    this.invitedUser = null;
    this.userExists = null;
    if (this.inviteAdminForm.invalid) {
      this.inviteAdminForm.markAllAsTouched();
      return;
    }
    // check if an active admin already exists with the entered email address
    const email = this.inviteAdminForm.get('email').value.toLowerCase();
    const existingMember = find(
      this.tenantUserRelations,
      (relation: TenantRelation) => {
        return relation.user.email.toLowerCase() === email;
      }
    );
    if (existingMember) {
      this.userExists =
        'Ein Nutzer mit Email Adresse ' + email + ' existiert bereits';
      return;
    }
    this.tenantService
      .addUser(this.tenant.id, this.inviteAdminForm.get('email').value)
      .subscribe(
        (invitation: Invitation) => {
          // only add the invitation to the list if there is no invitation with this email yet
          if (!find(this.invitations, { email: invitation.email })) {
            this.invitations.push(invitation);
          }
          this.invitedUser = invitation.email + ' wurde eingeladen';
          this.inviteAdminForm.reset();
        },
        error => {
          console.error(error);
          alert('Es trat ein Fehler auf');
        }
      );
  }

  delete(user: User): void {
    if (confirm('Wirklich diesen Nutzer entfernen?')) {
      this.userService.removeFromTenant(this.tenant.id, user.id).subscribe(
        () => {
          this.tenantUserRelations = reject(this.tenantUserRelations, {
            userId: user.id,
          });
          // if the user removed himself, jump to the profile:
          if (user.id === this.appService.getCurrentUser().id) {
            this.tenantService.getAll().subscribe();
            this.router.navigate([`/${ROUTES.PROFILE}`]);
          }
        },
        error => {
          console.error(error);
          alert('Beim Löschen trat leider ein Fehler auf!');
        }
      );
    }
  }

  assignRole(relation: TenantRelation, role: ROLE): void {
    relation.role = role;
    this.userService
      .setRole(relation.tenantId, relation.userId, role)
      .subscribe(() => {
        alert('Rolle zugewiesen');
      });
  }

  revokeInvitation(invitation: Invitation): void {
    if (confirm('Möchten Sie die Einladung wirklich zurückziehen?')) {
      this.tenantService
        .revokeOpenInvitations(invitation.tenantId, invitation.id)
        .subscribe(
          () => {
            alert('Die Einladung wurde zurückgezogen');
            this.invitations = reject(this.invitations, invitation);
          },
          error => {
            console.error(error);
            alert('Es trat ein Fehler auf');
          }
        );
    }
  }
}
