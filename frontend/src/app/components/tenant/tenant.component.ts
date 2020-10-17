import { Component, OnInit, OnDestroy, SecurityContext } from '@angular/core';
import { Tenant } from '../../models/tenant';
import { User } from 'src/app/models/user';
import { TenantService } from '../../services/tenant.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { clone, reject, findIndex, find } from 'lodash';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { TenantRelation } from 'src/app/models/tenant-relation';
import { AppService } from 'src/app/services/app.service';
import { ROLE } from '../../../../../common/tenant-relation';
import { Invitation } from 'src/app/models/invitation';

@Component({
  selector: 'app-tenant',
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.scss'],
})
export class TenantComponent implements OnInit, OnDestroy {
  tenant: Tenant = null;
  tenantUserRelations: TenantRelation[] = new Array<TenantRelation>();
  tenantForm: FormGroup;
  logoValidationError: string = null;
  private tenantSubscription: Subscription;
  operationOngoing: boolean = false;
  pathCheck = {
    pathTaken: false,
  };
  color: string;
  showInvitationForm: boolean = false;
  inviteAdminForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  ROLE = ROLE;
  invitations: Invitation[];

  constructor(
    private authService: AuthenticationService,
    private tenantService: TenantService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private domSanitizer: DomSanitizer,
    public appService: AppService
  ) {}

  ngOnInit(): void {
    // load the tenant information and redirect in case tenant path does not exist:
    this.tenantService
      .getByPath(this.route.snapshot.params.tenantPath)
      .subscribe(
        () => {},
        (error: any) => {
          console.log(error);
          if (
            error === 'Not Found' ||
            (error instanceof HttpErrorResponse && error.status === 404)
          ) {
            this.router.navigate(['fehler', 'account-not-found']);
          }
        }
      );
    this.tenantForm = new FormGroup({
      name: new FormControl('', Validators.required),
      path: new FormControl('', Validators.required),
      consentTeaser1: new FormControl('', Validators.maxLength(1000)),
      consentText1: new FormControl('', Validators.maxLength(10000)),
      consentTeaser2: new FormControl('', Validators.maxLength(1000)),
      consentText2: new FormControl('', Validators.maxLength(10000)),
    });
    this.tenantSubscription = this.appService.tenant.subscribe(
      (tenant: Tenant) => {
        if (tenant && tenant !== this.tenant) {
          // load tenant details
          this.tenantService.get(tenant.id).subscribe((tenant: Tenant) => {
            this.tenant = tenant;
            this.tenantForm.get('name').setValue(this.tenant.name);
            this.tenantForm.get('path').setValue(this.tenant.path);
            this.tenantForm
              .get('consentTeaser1')
              .setValue(this.tenant.consentTeaser1);
            this.tenantForm
              .get('consentText1')
              .setValue(this.tenant.consentText1);
            this.tenantForm
              .get('consentTeaser2')
              .setValue(this.tenant.consentTeaser2);
            this.tenantForm
              .get('consentText2')
              .setValue(this.tenant.consentText2);
            this.color = this.tenant.color;
          });
          // load users for this tenant
          this.tenantService
            .getUsers(tenant.id)
            .subscribe((relations: TenantRelation[]) => {
              this.tenantUserRelations = relations;
            });
          if (this.appService.hasRole(tenant.id, ROLE.OWNER)) {
            this.tenantService
              .getOpenInvitations(tenant.id)
              .subscribe((invitations: Invitation[]) => {
                this.invitations = invitations;
              });
          } else {
            this.invitations = null;
          }
        }
      }
    );
    this.tenantService.load(this.route.snapshot.params.tenantPath);
  }

  ngOnDestroy(): void {
    if (this.tenantSubscription) {
      this.tenantSubscription.unsubscribe();
    }
  }

  isInvalid(formControlName: string): boolean {
    return (
      this.tenantForm.get(formControlName).invalid &&
      this.tenantForm.get(formControlName).touched
    );
  }

  activate(user: User): void {
    this.userService
      .activate(this.tenant.id, user.id)
      .subscribe((activatedUser: User) => {
        const index = findIndex(this.tenantUserRelations, { userId: user.id });
        this.tenantUserRelations[index].active = true;
      });
  }

  updateTenant(): void {
    if (
      this.tenantForm.invalid ||
      this.pathCheck.pathTaken ||
      this.logoValidationError
    ) {
      alert('Bitte alle Felder korrekt ausfüllen');
      this.tenantForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const updatedTenant = clone(this.tenant);
    updatedTenant.name = this.tenantForm.get('name').value;
    updatedTenant.path = this.tenantForm.get('path').value;
    updatedTenant.consentTeaser1 = this.tenantForm.get('consentTeaser1').value;
    updatedTenant.consentText1 = this.tenantForm.get('consentText1').value;
    updatedTenant.consentTeaser2 = this.tenantForm.get('consentTeaser2').value;
    updatedTenant.consentText2 = this.tenantForm.get('consentText2').value;
    updatedTenant.color = this.color;
    // update the logo from the current tenant object
    if (this.tenant.logo) {
      if (typeof this.tenant.logo === 'object') {
        // it's a SafeResourceUrl oject - convert it to string first
        updatedTenant.logo = this.domSanitizer.sanitize(
          SecurityContext.RESOURCE_URL,
          this.tenant.logo
        );
      } else {
        // it's a string already (we assume) - no need to do anything
        updatedTenant.logo = this.tenant.logo;
      }
    }
    const pathChanged = updatedTenant.path !== this.tenant.path;
    this.tenantService.update(updatedTenant).subscribe(
      (tenant: Tenant) => {
        // update the tenant in the relations array
        const relations = this.appService.getCurrentTenantRelations();
        const relation = find(relations, { tenantId: tenant.id });
        if (relation) {
          relation.tenant = tenant;
        }
        this.appService.setCurrentTenantRelations(relations);
        this.appService.setCurrentTenant(tenant);
        if (pathChanged) {
          // the path was changed, reload the page
          this.router.navigate([tenant.path, 'verwaltung']);
        } else {
          this.tenant = tenant;
        }
        alert('Erfolgreich gespeichert');
        this.operationOngoing = false;
      },
      error => {
        console.error(error);
        alert('Beim Speichern trat leider ein Fehler auf!');
        this.operationOngoing = false;
      }
    );
  }

  delete(user: User): void {
    if (confirm('Wirklich diesen Nutzer entfernen?')) {
      this.operationOngoing = true;
      this.userService.removeFromTenant(this.tenant.id, user.id).subscribe(
        () => {
          this.tenantUserRelations = reject(this.tenantUserRelations, {
            userId: user.id,
          });
          this.operationOngoing = false;
          // if the user removed himself, jump to the profile:
          if (user.id === this.appService.getCurrentUser().id) {
            this.tenantService.getAll().subscribe();
            this.router.navigate(['/profil']);
          }
        },
        error => {
          console.error(error);
          alert('Beim Löschen trat leider ein Fehler auf!');
          this.operationOngoing = false;
        }
      );
    }
  }

  deleteTenant(): void {
    if (confirm('Wirklich den gesamten Account löschen?')) {
      this.operationOngoing = true;
      this.tenantService.delete(this.tenant.id).subscribe(() => {
        alert('Account gelöscht!');
        // go to profile view
        this.appService.setCurrentTenant(null);
        this.tenantService.getAll().subscribe();
        this.router.navigate(['/profil']);
      });
    }
  }

  checkPath(): void {
    // only check the path if it is different than the already-existing one
    const desiredNewPath = this.tenantForm.get('path').value;
    if (desiredNewPath !== this.tenant.path) {
      this.tenantService.checkPath(
        this.tenantForm.get('path').value,
        this.pathCheck
      );
    }
  }

  setNewLogo(newLogo: any): void {
    this.logoValidationError = null;
    const newLogoFile = <File>newLogo.target.files[0];
    // check that image does not exceed maximum size
    // 1024 bytes = 1 kB
    const kiloBytes = Math.round(newLogoFile.size / 1024);
    if (kiloBytes > 500) {
      // 1024 kiloBytes = 1 MB
      const fileSize =
        kiloBytes / 1024 >= 1
          ? `${(kiloBytes / 1024).toFixed(2)} MB`
          : `${kiloBytes} kB`;
      this.logoValidationError = `Das gewählte Bild ist zu groß (${fileSize}). Die maximale Größe eines Logos ist 500 kB`;
      return;
    }
    var myReader: FileReader = new FileReader();
    myReader.onloadend = e => {
      this.tenant.logo = <string>myReader.result;
    };
    myReader.readAsDataURL(newLogoFile);
  }

  currentLengthOf(formControlName: string): number {
    try {
      return (this.tenantForm.get(formControlName).value as string).length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * simply trigger the browser to open the file select modal
   */
  selectNewLogo(): void {
    document.getElementById('logo_file_input').click();
  }

  inviteNewAdmin(): void {
    if (this.inviteAdminForm.invalid) {
      this.inviteAdminForm.markAllAsTouched();
      return;
    }
    this.tenantService
      .addUser(this.tenant.id, this.inviteAdminForm.get('email').value)
      .subscribe(
        () => {
          // reload the user list, just in case
          this.tenantService
            .getUsers(this.tenant.id)
            .subscribe((relations: TenantRelation[]) => {
              this.tenantUserRelations = relations;
            });
          alert('Nutzer wurde eingeladen');
          this.inviteAdminForm.reset();
        },
        error => {
          console.error(error);
          alert('Es trat ein Fehler auf');
        }
      );
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
