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
        const event = await Event.findByPk(parseInt(req.params.eventid));
        const logMessage = `Zugriff auf Teilnehmerliste zu Event ${event.id}`;
        Log.build({ user: UserService.currentUser(req), message: logMessage }).save();
        const participants = await Participant.findAll({ where: { EventId: event.id } });
        const binaryResult = await PdfService.generate(event, participants);
        res.contentType('application/pdf').send(binaryResult);
      } catch (err) {
        res.status(500).send({ message: `Error generating PDF: ${err.message}` });
      }
    });
  }
}
