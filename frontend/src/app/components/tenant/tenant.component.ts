import { Component, OnInit, OnDestroy } from "@angular/core";
import { Tenant } from "../../models/tenant";
import { User } from "src/app/models/user";
import { TenantService } from "../../services/tenant.service";
import { AuthenticationService } from "src/app/services/authentication.service";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { clone, reject, findIndex } from "lodash";
import { UserService } from "src/app/services/user.service";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from 'rxjs';

@Component({
  selector: "app-tenant",
  templateUrl: "./tenant.component.html",
  styleUrls: ["./tenant.component.scss"],
})
export class TenantComponent implements OnInit, OnDestroy {
  tenant: Tenant = null;
  users: User[] = new Array<User>();
  tenantForm: FormGroup;
  private tenantSubscription: Subscription;

  constructor(
    private authService: AuthenticationService,
    private tenantService: TenantService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.tenantForm = new FormGroup({
      name: new FormControl("", Validators.required),
      path: new FormControl("", Validators.required),
    });
    this.tenantSubscription = this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant) {
        // load tenant details
        this.tenantService
          .get(tenant.id)
          .subscribe((tenant: Tenant) => {
            this.tenant = tenant;
            this.tenantForm.get("name").setValue(this.tenant.name);
            this.tenantForm.get("path").setValue(this.tenant.path);
          });
        // load users for this tenant
        this.tenantService
          .getUsers(tenant.id)
          .subscribe((users: User[]) => {
            this.users = users;
          });
      }
    })
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
    if (this.tenantForm.invalid) {
      this.tenantForm.markAllAsTouched();
      return;
    }
    const updatedTenant = clone(this.tenant);
    updatedTenant.name = this.tenantForm.get("name").value;
    updatedTenant.path = this.tenantForm.get("path").value;
    this.tenantService.update(updatedTenant).subscribe((tenant: Tenant) => {
      this.tenant = tenant;
    });
  }

  delete(user: User): void {
    if (confirm("Wirklich diesen Nutzer löschen?")) {
      this.userService.delete(user.id).subscribe(() => {
        this.users = reject(this.users, user);
        // if the user deleted himself, log out explicitly:
        if (user.id === this.authService.userValue.id) {
          this.authService.logout();
        }
      });
    }
  }

  deleteTenant(): void {
    if (confirm("Wirklich den gesamten Account löschen?")) {
      this.tenantService.delete(this.tenant.id).subscribe(() => {
        alert("Account gelöscht!");
        this.authService.logout();
      });
    }
  }
}
