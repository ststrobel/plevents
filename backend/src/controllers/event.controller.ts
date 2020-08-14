import * as express from 'express';
import { Event } from '../models/event';
import { ParticipantI } from '../../../common/participant';
import { EventI } from '../../../common/event';
import { Participant } from '../models/participant';
import { each, find } from 'lodash';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';

export class EventController {
  public static register(app: express.Application): void {
    app.get('/events', async (req, res) => {
      // first, get all events
      const allEvents = await Event.findAll();
      // then, retrieve the participants per event
      const promises = [];
      each(allEvents, (event: Event) => {
        promises.push(Participant.findAll({ where: { EventId: event.id } }));
        event.dataValues.takenSeats = 0;
      });
      // return events with participants count
      Promise.all(promises).then(
        (allParticipantsForEvents: Participant[][]) => {
          each(allParticipantsForEvents, (participantsPerEvent: Participant[]) => {
            if (participantsPerEvent.length > 0) {
              find(allEvents, { id: participantsPerEvent[0].EventId }).dataValues.takenSeats =
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
      const event = await Event.findOrCreate({
        where: {
          name: eventToCreate.name,
          date: eventToCreate.date,
          targetClass: eventToCreate.targetClass,
          maxSeats: eventToCreate.maxSeats,
          tenantId: (await UserService.currentTenant(req)).id,
        },
      });
      const logMessage = `Event ${event[0].id} erstellt`;
      Log.log(UserService.currentTenant(req), UserService.currentUser(req), logMessage);
      res.status(200).send(event[0]);
    });

    app.put('/secure/events/:id/disabled/:disabled', async (req, res) => {
      const event = await Event.findByPk(req.params.id);
      if (event) {
        // now check if the logged-in user belongs to the tenant that the event belongs to
        if (event.tenantId === (await UserService.currentTenant(req)).id) {
          event.disabled = req.params.disabled;
          event.save();
          const logMessage = `Event ${req.params.id} wurde auf ${event.disabled ? 'disabled' : 'enabled'} gesetzt`;
          Log.log(UserService.currentTenant(req), UserService.currentUser(req), logMessage);
          res.status(200).send(event);
        } else {
          res.status(403).send({ error: 'You are not authorized to delete this event' });
        }
      } else {
        res.status(404).send({ error: 'Event not found' });
      }
    });

    app.delete('/secure/events/:id', async (req, res) => {
      // first check if the event exists at all
      const eventToDelete = (await Event.findByPk(req.params.id)) as Event;
      if (eventToDelete) {
        // now check if the logged-in user belongs to the tenant that the event belongs to
        if (eventToDelete.tenantId === (await UserService.currentTenant(req)).id) {
          await Event.destroy({
            where: {
              id: req.params.id,
            },
          });
          const logMessage = `Event ${req.params.id} gelöscht`;
          Log.log(UserService.currentTenant(req), UserService.currentUser(req), logMessage);
          res.status(200).send({ message: 'Event deleted' });
        } else {
          res.status(403).send({ error: 'You are not authorized to delete this event' });
        }
      } else {
        res.status(404).send({ error: 'Event not found' });
      }
    });

    app.post('/events/:id/participant', async (req, res) => {
      const newParticipant = <ParticipantI>req.body;
      newParticipant.EventId = parseInt(req.params.id);
      const participant = await Participant.findOne({ where: newParticipant });
      if (participant === null) {
        // check if there are still free seats on the event:
        const event = await Event.findByPk(req.params.id);
        if (event === null) {
          // error, no such event
          res.status(404).send({ message: 'Event not found' });
        } else {
          // now gather all information on the already reserved seats
          const participants = await Participant.findAll({ where: { EventId: newParticipant.EventId } });
          if (event.maxSeats > participants.length) {
            const createdParticipant = await Participant.build(newParticipant).save();
            res.status(200).send(createdParticipant);
          } else {
            res.status(409).send({ message: 'All seats are taken already' });
          }
        }
      } else {
        // the participant is already on the event
        res.status(200).send(participant);
      }
    });
  }
}
