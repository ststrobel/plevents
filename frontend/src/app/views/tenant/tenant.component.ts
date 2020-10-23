import { Component, OnInit, OnDestroy } from '@angular/core';
import { Tenant } from '../../models/tenant';
import { TenantService } from '../../services/tenant.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { clone, find } from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/services/app.service';
import { ROLE } from '../../../../../common/tenant-relation';
import { ROUTES } from '../../../../../common/frontend.routes';

@Component({
  selector: 'app-tenant',
  templateUrl: './tenant.component.html',
  styleUrls: ['./tenant.component.scss'],
})
export class TenantComponent implements OnInit, OnDestroy {
  tenant: Tenant = null;
  logoValidationError: string = null;
  private tenantSubscription: Subscription;
  operationOngoing: boolean = false;
  pathCheck = {
    pathTaken: false,
  };
  color: string;
  ROLE = ROLE;
  tenantForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    path: new FormControl('', Validators.required),
  });
  legalForm: FormGroup = new FormGroup({
    consentTeaser1: new FormControl('', Validators.maxLength(1000)),
    consentText1: new FormControl('', Validators.maxLength(10000)),
    consentTeaser2: new FormControl('', Validators.maxLength(1000)),
    consentText2: new FormControl('', Validators.maxLength(10000)),
  });

  constructor(
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router,
    public appService: AppService
  ) {}

  ngOnInit(): void {
    this.tenant = null;
    this.tenantSubscription = this.appService.tenant.subscribe(
      (tenant: Tenant) => {
        if (tenant && tenant.path === this.route.snapshot.params.tenantPath) {
          this.appService.setColor(tenant);
          this.tenant = tenant;
          this.setFormValues();
        }
      }
    );
    this.tenantService.load(this.route.snapshot.params.tenantPath, true);
  }

  ngOnDestroy(): void {
    this.appService.setColor(null);
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

  setFormValues(): void {
    this.tenantForm.get('name').setValue(this.tenant.name);
    this.tenantForm.get('path').setValue(this.tenant.path);
    this.legalForm.get('consentTeaser1').setValue(this.tenant.consentTeaser1);
    this.legalForm.get('consentText1').setValue(this.tenant.consentText1);
    this.legalForm.get('consentTeaser2').setValue(this.tenant.consentTeaser2);
    this.legalForm.get('consentText2').setValue(this.tenant.consentText2);
    this.color = this.tenant.color;
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
    updatedTenant.color = this.color;
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
          this.router.navigate([tenant.path, ROUTES.TENANT_MANAGEMENT]);
        } else {
          this.tenant = tenant;
          this.setFormValues();
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

  updateLegalTexts(): void {
    if (this.legalForm.invalid) {
      alert('Bitte alle Felder korrekt ausfüllen');
      this.legalForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const updatedTenant = clone(this.tenant);
    updatedTenant.consentTeaser1 = this.legalForm.get('consentTeaser1').value;
    updatedTenant.consentText1 = this.legalForm.get('consentText1').value;
    updatedTenant.consentTeaser2 = this.legalForm.get('consentTeaser2').value;
    updatedTenant.consentText2 = this.legalForm.get('consentText2').value;
    this.tenantService.update(updatedTenant).subscribe(
      (tenant: Tenant) => {
        this.tenant = tenant;
        this.setFormValues();
        // update the tenant in the relations array
        const relations = this.appService.getCurrentTenantRelations();
        const relation = find(relations, { tenantId: tenant.id });
        if (relation) {
          relation.tenant = tenant;
        }
        this.appService.setCurrentTenantRelations(relations);
        this.appService.setCurrentTenant(tenant);
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

  deleteTenant(): void {
    if (confirm('Wirklich die gesamte Organisation löschen?')) {
      this.operationOngoing = true;
      this.tenantService.delete(this.tenant.id).subscribe(() => {
        alert('Organisation gelöscht!');
        // go to profile view
        this.appService.setCurrentTenant(null);
        this.tenantService.getAll().subscribe();
        this.router.navigate([`/${ROUTES.PROFILE}`]);
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
      if (this.tenantForm.get(formControlName)) {
        return (this.tenantForm.get(formControlName).value as string).length;
      }
      if (this.legalForm.get(formControlName)) {
        return (this.legalForm.get(formControlName).value as string).length;
      }
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
