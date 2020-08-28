
import { Tenant } from "../models/tenant";
import { TenantService } from "../services/tenant.service";
import { ActivatedRoute, Router } from "@angular/router";

export class TenantSpecificView {

    protected tenant: Tenant;

    constructor(private tenantService: TenantService, private router: Router) {

    }

    protected checkIfPathExists(route: ActivatedRoute): void {
        const path = route.snapshot.params.tenantPath;
        this.tenantService.getByPath(path).subscribe((tenant: Tenant) => {
            this.tenant = tenant;
        }, (error) => {
            this.router.navigate(['fehler', 'account-not-found']);
        });
    }
}