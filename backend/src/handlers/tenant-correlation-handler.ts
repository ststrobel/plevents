import { Request, Response } from 'express';
import { find } from 'lodash';
import { Tenant } from '../models/tenant';
import { UserService } from '../services/user.service';

export default async (req: Request, res: Response, next: any) => {
  const tenant = await Tenant.findOne(req.params.tenantId);
  if (tenant) {
    // check if the user is in the list of admins for this tenant
    const tenants = await UserService.tenantsOfRequestUser(req);
    if (find(tenants, tenant)) {
      next();
    } else {
      res.status(403).send({ message: 'You are not related to the tenant' });
    }
  } else {
    res.status(404).send({ error: 'Tenant not existing' });
  }
};
