import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { clone, reject } from 'lodash';
import { Invitation } from 'src/app/models/invitation';
import { Tenant } from 'src/app/models/tenant';
import { TenantRelation } from 'src/app/models/tenant-relation';
import { User } from 'src/app/models/user';
import { AppService } from 'src/app/services/app.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { TenantService } from 'src/app/services/tenant.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  tenantRelations: TenantRelation[] = null;
  user: User = null;
  nameForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
  });
  invitations: Invitation[];
  passwordForm: FormGroup = new FormGroup({
    oldPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', Validators.required),
  });

  operationOngoing: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthenticationService,
    private tenantService: TenantService,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.operationOngoing = true;
    this.userService.getProfile().subscribe((user: User) => {
      this.user = user;
      this.authService.update(this.user);
      this.nameForm.get('name').setValue(this.user.name);
      this.operationOngoing = false;
    });
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

  isInvalid(formControlName: string): boolean {
    if (this.nameForm.contains(formControlName)) {
      return (
        this.nameForm.get(formControlName).invalid &&
        this.nameForm.get(formControlName).touched
      );
    }
    if (this.passwordForm.contains(formControlName)) {
      return (
        this.passwordForm.get(formControlName).invalid &&
        this.passwordForm.get(formControlName).touched
      );
    }

    return false;
  }

  updateName(): void {
    if (this.nameForm.invalid) {
      this.nameForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const updatePayload = clone(this.user);
    updatePayload.name = this.nameForm.get('name').value;
    this.userService.updateProfile(updatePayload).subscribe(
      (updatedUser: User) => {
        this.user = updatedUser;
        this.authService.update(this.user);
        alert('Name geändert');
        this.operationOngoing = false;
      },
      error => {
        console.error(error);
        this.operationOngoing = false;
      }
    );
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    this.userService
      .updatePassword(
        this.passwordForm.get('oldPassword').value,
        this.passwordForm.get('newPassword').value
      )
      .subscribe(
        () => {
          alert('Passwort geändert');
          this.authService.update(
            this.user,
            this.passwordForm.get('newPassword').value
          );
          this.operationOngoing = false;
        },
        error => {
          console.error(error);
          alert('Fehler bei Passwort-Änderung');
          this.operationOngoing = false;
        }
      );
  }

  detach(tenantRelation: TenantRelation): void {
    if (confirm('Möchten Sie sich wirklich von diesem Account trennen?')) {
      this.userService
        .removeFromTenant(tenantRelation.tenantId, tenantRelation.userId)
        .subscribe(
          () => {
            alert(
              'Sie haben sich vom Account "' +
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
                'Sie sind der einzige Administrator für diesen Account und können sich daher nicht von ihm trennen'
              );
            } else {
              alert('Es trat ein Fehler auf');
            }
          }
        );
    }
  }

  deleteProfile(): void {
    if (
      confirm(
        'Möchten Sie wirklich Ihr persönliches Profil löschen? Alle Daten werden sofort gelöscht. Diese Aktion kann nicht rückgängig gemacht werden!'
      )
    ) {
      this.operationOngoing = true;
      this.userService.deleteProfile().subscribe(
        () => {
          alert('Ihr Profil wurde gelöscht');
          this.authService.logout();
        },
        error => {
          console.error(error);
          alert('Es trat ein Fehler auf');
          this.operationOngoing = false;
        }
      );
    }
  }

  join(invitation: Invitation): void {
    this.userService.acceptInvitation(invitation.id).subscribe(
      (tenantRelation: TenantRelation) => {
        this.tenantRelations.push(tenantRelation);
        this.invitations = reject(this.invitations, invitation);
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
