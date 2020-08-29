import * as express from 'express';
import { PdfService } from '../services/pdf.service';
import { Event } from '../models/event';
import { Participant } from '../models/participant';
import { UserService } from '../services/user.service';
import { Log } from '../models/log';

export class PdfController {
  public static register(app: express.Application): void {
    app.get('/secure/events/:eventid/pdf', async (req, res, next) => {
      try {
        // check that the logged in user belongs to the org to see this data
        const tenantOfLoggedInUser = await UserService.currentTenant(req);
        const event = await Event.findOne(req.params.eventid);
        if (event.tenantId === tenantOfLoggedInUser.id) {
          Log.write(
            UserService.currentTenant(req),
            UserService.currentUser(req),
            `Zugriff auf Teilnehmerliste zu Event ${event.id}`
          );
          const participants = await Participant.find({
            where: { eventId: event.id },
          });
          const binaryResult = await PdfService.generate(event, participants);
          res.contentType('application/pdf').send(binaryResult);
        } else {
          res.status(403).send({ message: `No access to this data` });
        }
      } catch (err) {
        res
          .status(500)
          .send({ message: `Error generating PDF: ${err.message}` });
      }
    });
  }
}
