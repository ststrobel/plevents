import * as express from 'express';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import { UserI } from '../../../common/user';
import { User } from '../models/user';
import { TenantI } from '../../../common/tenant';
import { getConnection } from 'typeorm';

export class TenantController {
  public static register(app: express.Application): void {
    /*
     * create a new tenant. this is a public endpoint, anyone can create one
     */
    app.post('/tenants', async (req, res) => {
      const tenantToCreate = <TenantI>req.body;
      let tenant = await Tenant.findOne({
        path: tenantToCreate.path,
      });
      if (!tenant) {
        tenant = new Tenant();
        tenant.name = tenantToCreate.name;
        tenant.path = tenantToCreate.path;
        await tenant.save();
        const logMessage = `Tenant ${tenant.id} erstellt`;
        res.status(200).send(tenant);
      } else {
        res.status(404).send({ error: "Tenant already exists" });
      }
    });

    /*
     * retrieve a tenant based on its id
     */
    app.get('/secure/tenants/:id', async (req, res) => {
      const tenant = await Tenant.findOne(req.params.id);
      if (tenant) {
        res.status(200).send(tenant);
      } else {
        res.status(404).send({ error: 'Tenant not existing' });
      }
    });

    /*
     * retrieve a tenant based on its path name
     */
    app.get('/tenants/:path', async (req, res) => {
      const tenant = await Tenant.findOne({
          path: req.params.path
      });
      if (tenant) {
        res.status(200).send(tenant);
      } else {
        res.status(404).send({ error: 'Tenant not existing' });
      }
    });

    /*
     * update a tenant
     */
    app.put('/secure/tenants/:id', async (req, res) => {
      const tenant = await Tenant.findOne(req.params.id);
      if (tenant) {
        // check if the user is allowed to update this tenant's information:
        if (tenant.id === (await UserService.currentTenant(req)).id) {
          tenant.name = req.body.name;
          tenant.path = req.body.path;
          tenant.logo = req.body.logo;
          tenant.save();
          res.status(200).send(tenant);
        } else {
          res.status(403).send({ message: 'You are not allowed to update this tenant' });
        }
      } else {
        res.status(404).send({ error: 'Tenant not existing' });
      }
    });

    /*
     * delete the tenant, including all its users and events (including their participants)
     */
    app.delete('/secure/tenants/:id', async (request, res) => {
      // first, check if the client is connected to the tenant he/she wants to delete:
      const currentUser = (await User.findOne({ email: UserService.currentUser(request) }));
      // if the user does not belong to this tenant, deny the request
      if (currentUser.tenant.id === parseInt(request.params.id, 10)) {
        getConnection()
          .createQueryBuilder()
          .delete()
          .from(Tenant)
          .where(`id = ${request.params.id}`)
          .execute();
        Log.write(currentUser.tenant.id, currentUser.id, `Tenant ${request.params.id} gelöscht`);
        res.status(200).send({ message: 'Tenant deleted' });
      } else {
        // user does not belong to this tenant. Prevent it from being deleted!
        res.status(403).send({ message: 'You are not allowed to delete this tenant' });
      }
    });

    /*
     * add a new user to the tenant using self-registration, this is public
     */
    app.post('/tenants/:id/users', async (request, response) => {
      const newUser = <UserI>request.body;
      // make sure user doesn't exist yet
      const existingUser = await User.findOne({ where: {email: newUser.email} });
      if (!existingUser) {
        // create the user
        const createdUser = await UserService.createUser(parseInt(request.params.id, 10), newUser.email, newUser.name, newUser.password);
        // check if this is the first user on this tenant. if so, activate him immediatly:
        delete createdUser.password;
        const currentUserCount = await getConnection()
          .createQueryBuilder()
          .select("user")
          .from(User, "user")
          .where("user.tenantId = " + request.params.id)
          .getCount();
        if (currentUserCount === 1) {
          createdUser.active = true;
          await createdUser.save();
        }
        response.status(201).send(createdUser);
      } else {
        // a user already exists in the system, maybe for another tenant
        response.status(409).send({ error: 'User already exists in system' });
      }
    });

    /*
     * retrieve all users for a given tenant
     */
    app.get('/secure/tenants/:id/users', async (request, response) => {
      // first, check if the tenant exists
      const tenantOfLoggedInUser = await Tenant.findOne({
        id: (await UserService.currentTenant(request)).id },
      );
      if (tenantOfLoggedInUser) {
        // if the user does not belong to this tenant, deny the request
        if (tenantOfLoggedInUser.id === parseInt(request.params.id, 10)) {
          const users = await User.find({
              tenant: tenantOfLoggedInUser,
            },
          );
          response.status(200).send(users);
        } else {
          // user does not belong to this tenant. Prevent users showing to wrong audience
          response.status(403).send({ message: 'You are not allowed to retrieve users for this tenant' });
        }
      } else {
        response.status(404).send({ message: 'Tenant not found' });
      }
    });
  }
}
