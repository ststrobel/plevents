import * as express from 'express';
import { PdfService } from '../services/pdf.service';
import { Event } from '../models/event';
import { Participant } from '../models/participant';
import { UserService } from '../services/user.service';
import { Log } from '../models/log';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';

export class PdfController {
  public static register(app: express.Application): void {
    app.get(
      '/secure/tenants/:tenantId/events/:eventId/pdf',
      tenantCorrelationHandler,
      async (req, res, next) => {
        try {
          Log.write(
            req.params.tenantId,
            UserService.currentUser(req),
            `Zugriff auf Teilnehmerliste zu Event ${req.params.eventId}`
          );
          const event = await Event.findOneOrFail(req.params.eventId);
          const participants = await Participant.find({
            where: { eventId: event.id },
          });
          const binaryResult = await PdfService.generate(event, participants);
          res.contentType('application/pdf').send(binaryResult);
        } catch (err) {
          res
            .status(500)
            .send({ message: `Error generating PDF: ${err.message}` });
        }
      }
    );
  }
}
