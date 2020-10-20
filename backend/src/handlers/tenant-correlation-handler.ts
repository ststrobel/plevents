import { Request, Response } from 'express';
import { find } from 'lodash';
import { Tenant } from '../models/tenant';
import { TenantRelation } from '../models/tenant-relation';
import { User } from '../models/user';
import { UserService } from '../services/user.service';

export default (requiredRole?: string) => {
  return async (req: Request, res: Response, next: any) => {
    const tenant = await Tenant.findOne(req.params.tenantId);
    if (tenant) {
      // check if the user is in the list of admins for this tenant
      const user = await UserService.currentUser(req);
      const relation = await TenantRelation.findOne({
        tenantId: tenant.id,
        userId: user.id,
      });
      if (relation) {
        if (requiredRole && !relation.hasRole(requiredRole)) {
          res.status(403).send({ message: 'You are lacking permissions' });
        } else {
          next();
        }
      } else {
        res.status(403).send({ message: 'You are not related to the tenant' });
      }
    } else {
      res.status(404).send({ error: 'Tenant not existing' });
    }
  };
};
