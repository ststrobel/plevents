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
        const event = await Event.findOne(parseInt(req.params.eventid));
        Log.write(UserService.currentUser(req), `Zugriff auf Teilnehmerliste zu Event ${event.id}`);
        const participants = await Participant.find({ where: { eventId: event.id } });
        const binaryResult = await PdfService.generate(event, participants);
        res.contentType('application/pdf').send(binaryResult);
      } catch (err) {
        res.status(500).send({ message: `Error generating PDF: ${err.message}` });
      }
    });
  }
}
