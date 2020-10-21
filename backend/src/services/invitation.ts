import { Invitation } from '../models/invitation';
import { EmailService, EMAIL_TEMPLATES } from './email-service';
import { User } from '../models/user';
import { TenantRelation } from '../models/tenant-relation';
import { Tenant } from '../models/tenant';
import { ROUTES } from '../../../common/frontend.routes';

export class InvitationService {
  private static singleton: InvitationService = null;

  /**
   * get the service instance
   */
  static get(): InvitationService {
    if (InvitationService.singleton === null) {
      InvitationService.singleton = new InvitationService();
    }
    return InvitationService.singleton;
  }

  async invite(tenantId: string, email: string): Promise<void> {
    const tenant = await Tenant.findOneOrFail(tenantId);
    const invitation = new Invitation();
    invitation.tenantId = tenantId;
    invitation.email = email;
    await invitation.save();
    const linkToProfile = `${process.env.DOMAIN}/${ROUTES.PROFILE}?join=${invitation.tenantId}`;
    EmailService.get().send(EMAIL_TEMPLATES.JOIN_TENANT, email, {
      tenant: tenant.name,
      linkToProfile,
    });
  }

  getInvitationsByTenant(tenantId: string): Promise<Invitation[]> {
    return Invitation.find({ where: { tenantId } });
  }

  getInvitationsByUser(email: string): Promise<Invitation[]> {
    return Invitation.find({ where: { email } });
  }

  async acceptInvitation(id: string, email: string): Promise<void> {
    // try to find a user with this email
    const user = await User.findOneOrFail({ email });
    // then check if the referenced invitation exists
    const invitation = await Invitation.findOneOrFail(id);
    // attach the user to the tenant and remove all potential other invitations
    const relation = new TenantRelation();
    relation.tenantId = invitation.tenantId;
    relation.userId = user.id;
    await relation.save();
    this.withdrawInvitation(invitation.tenantId, email);
  }

  withdrawInvitation(tenantId: string, email: string): void {
    Invitation.delete({ tenantId, email });
  }
}
