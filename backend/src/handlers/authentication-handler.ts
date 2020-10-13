import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export default async (req: Request, res: Response, next: any) => {
  if (req.path.startsWith('/secure')) {
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'ascii'
      );
      const [email, password] = credentials.split(':');
      if (await UserService.checkCredentials(email, password)) {
        // authentication was successful
        next();
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(401);
    }
  } else {
    // no authentication needed
    next();
  }
};
