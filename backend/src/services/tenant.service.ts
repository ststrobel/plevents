import { TenantI } from '../../../common/tenant';
import { ROLE } from '../../../common/tenant-relation';
import { Log } from '../models/log';
import { Tenant } from '../models/tenant';
import { TenantRelation } from '../models/tenant-relation';
import { User } from '../models/user';
import { EmailService, EMAIL_TEMPLATES } from './email-service';

export class TenantService {
  private static singleton: TenantService = null;

  /**
   * get the service instance
   */
  static get(): TenantService {
    if (TenantService.singleton === null) {
      TenantService.singleton = new TenantService();
    }
    return TenantService.singleton;
  }

  async createNewTenant(
    tenantToCreate: TenantI,
    ownerUser: User
  ): Promise<Tenant> {
    const tenant = new Tenant();
    tenant.name = tenantToCreate.name;
    tenant.path = tenantToCreate.path;
    tenant.consentTeaser1 = tenantToCreate.consentTeaser1;
    tenant.consentText1 = tenantToCreate.consentText1;
    tenant.consentTeaser2 = tenantToCreate.consentTeaser2;
    tenant.consentText2 = tenantToCreate.consentText2;
    tenant.color = tenantToCreate.color;
    await tenant.save();
    const relation = new TenantRelation();
    relation.user = ownerUser;
    relation.tenant = tenant;
    relation.active = true;
    relation.role = ROLE.OWNER;
    relation.save();
    Log.write(tenant.id, ownerUser.id, `Tenant ${tenant.id} erstellt`);
    // send a notification email to myself :-)
    EmailService.get().send(
      EMAIL_TEMPLATES.NEW_TENANT,
      'stefan.strobel@s4-consulting.de',
      { tenantName: tenant.name, tenantPath: tenant.path }
    );
    return tenant;
  }

  async getRelationsByUser(userId: string): Promise<TenantRelation[]> {
    return await TenantRelation.find({
      where: { userId },
      relations: ['tenant'],
    });
  }
}
