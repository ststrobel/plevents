import { Component, OnInit, OnDestroy, SecurityContext } from '@angular/core';
import { Tenant } from '../../models/tenant';
import { User } from 'src/app/models/user';
import { TenantService } from '../../services/tenant.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { clone, reject, findIndex } from 'lodash';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-tenant',
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.scss'],
})
export class TenantComponent implements OnInit, OnDestroy {
  tenant: Tenant = null;
  users: User[] = new Array<User>();
  tenantForm: FormGroup;
  logoValidationError: string = null;
  private tenantSubscription: Subscription;
  operationOngoing: boolean = false;
  pathCheck = {
    pathTaken: false,
  };

  constructor(
    private authService: AuthenticationService,
    private tenantService: TenantService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private domSanitizer: DomSanitizer
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
    this.tenantSubscription = this.tenantService.currentTenant.subscribe(
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
          });
          // load users for this tenant
          this.tenantService.getUsers(tenant.id).subscribe((users: User[]) => {
            this.users = users;
          });
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
    this.userService.activate(user.id).subscribe((activatedUser: User) => {
      const index = findIndex(this.users, { id: user.id });
      // Replace item at index using native splice
      this.users.splice(index, 1, activatedUser);
    });
  }

  updateTenant(): void {
    if (
      this.tenantForm.invalid ||
      this.pathCheck.pathTaken ||
      this.logoValidationError
    ) {
      console.log(this.tenantForm.errors);
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
    if (confirm('Wirklich diesen Nutzer löschen?')) {
      this.operationOngoing = true;
      this.userService.delete(user.id).subscribe(
        () => {
          this.users = reject(this.users, user);
          this.operationOngoing = false;
          // if the user deleted himself, log out explicitly:
          if (user.id === this.authService.userValue.id) {
            this.authService.logout();
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
        this.authService.logout();
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
}
