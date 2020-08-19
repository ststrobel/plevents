import * as express from 'express';
import { Event } from '../models/event';
import { ParticipantI } from '../../../common/participant';
import { EventI } from '../../../common/event';
import { Participant } from '../models/participant';
import { each, find } from 'lodash';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { User } from '../models/user';
import { getConnection } from 'typeorm';

export class EventController {
  public static register(app: express.Application): void {
    app.get('/events', async (req, res) => {
      // first, get all events
      const allEvents = await Event.find();
      // then, retrieve the participants per event
      const promises = [];
      each(allEvents, (event: Event) => {
        promises.push(Participant.find({ where: { eventId: event.id }}));
        event.takenSeats = 0;
      });
      // return events with participants count
      Promise.all(promises).then(
        (allParticipantsForEvents: Participant[][]) => {
          each(allParticipantsForEvents, (participantsPerEvent: Participant[]) => {
            if (participantsPerEvent.length > 0) {
              find(allEvents, { id: participantsPerEvent[0].event.id }).takenSeats =
                participantsPerEvent.length;
            }
          });
          res.send(allEvents);
        },
        (err: any) => {
          res.status(500).send({ message: `Error calculating taken seats: ${err}` });
        }
      );
    });

    app.post('/secure/events', async (req, res) => {
      const eventToCreate = <EventI>req.body;
      const event = new Event();
      event.name = eventToCreate.name;
      event.date = eventToCreate.date;
      event.targetClass = eventToCreate.targetClass;
      event.maxSeats = eventToCreate.maxSeats;
      event.save();
      Log.write(UserService.currentUser(req), `Event ${event[0].id} erstellt`);
      res.status(200).send(event);
    });

    app.put('/secure/events/:id/disabled/:disabled', async (req, res) => {
      const event = await Event.findOne(req.params.id);
      if (event) {
        event.disabled = req.params.disabled === "true";
        event.save();
        Log.write(UserService.currentUser(req), `Event ${req.params.id} wurde auf ${event.disabled ? 'disabled' : 'enabled'} gesetzt`);
        res.status(200).send(event);
      } else {
        res.sendStatus(404);
      }
    });

    app.delete('/secure/events/:id', async (req, res) => {
      getConnection()
        .createQueryBuilder()
        .delete()
        .from(Event)
        .where(`id = ${req.params.id}`)
        .execute();
      Log.write(UserService.currentUser(req), `Event ${req.params.id} gelöscht`);
      res.status(200).send({ message: 'Event deleted' });
    });

    app.post('/events/:id/participant', async (req, res) => {
      const newParticipant = <ParticipantI>req.body;
      newParticipant.eventId = parseInt(req.params.id);
      const participant = await Participant.findOne({ where: newParticipant });
      if (participant === null) {
        // check if there are still free seats on the event:
        const event = await Event.findOne(req.params.id);
        if (event === null) {
          // error, no such event
          res.status(404).send({ message: 'Event not found' });
        } else {
          // now gather all information on the already reserved seats
          const participants = await Participant.find({ where: { eventId: newParticipant.eventId } });
          if (event.maxSeats > participants.length) {
            const createdParticipant = newParticipant as Participant;
            createdParticipant.save();
            res.status(200).send(createdParticipant);
          } else {
            res.status(429).send({ message: 'All seats are taken already' });
          }
        }
      } else {
        // the participant is already on the event
        res.status(200).send(participant);
      }
    });
  }
}
