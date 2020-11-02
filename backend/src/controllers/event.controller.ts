import * as express from 'express';
import { Event } from '../models/event';
import { ParticipantI } from '../../../common/participant';
import { EventI } from '../../../common/event';
import { Participant } from '../models/participant';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { Tenant } from '../models/tenant';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';
import { EventService } from '../services/event.service';
import { EventSeries } from '../models/event-series';

export class EventController {
  public static register(app: express.Application): void {
    app.get('/tenants/:tenantId/events', async (req, res) => {
      // check if the related tenant is active. if not, respond with an error:
      const tenant = await Tenant.findOneOrFail(req.params.tenantId);
      if (!tenant.active) {
        return res.status(402).send({ error: 'Tenant not active' });
      }
      const events = await EventService.get().getEvents(
        tenant.id,
        req.query.start as string,
        req.query.end as string
      );
      res.status(200).send(events);
    });

    app.get('/secure/tenants/:tenantId/events', async (req, res) => {
      const events = await EventService.get().getEvents(
        req.params.tenantId,
        req.query.start as string,
        req.query.end as string
      );
      res.status(200).send(events);
    });

    app.post(
      '/secure/tenants/:tenantId/events',
      tenantCorrelationHandler(),
      async (req, res) => {
        const eventToCreate = <EventI>req.body;
        if (eventToCreate.singleOccurence) {
          const event = await EventService.get().addEvent(
            req.params.tenantId,
            eventToCreate
          );
          res.status(201).send(event);
        } else {
          const eventSeries = await EventService.get().addEventSeries(
            req.params.tenantId,
            eventToCreate
          );
          res.status(201).send(eventSeries);
        }

        /*Log.write(
          event.tenantId,
          UserService.username(req),
          `Event ${event.id} erstellt`
        );*/
      }
    );

    app.get(
      '/secure/tenants/:tenantId/events/:eventid/participants',
      tenantCorrelationHandler(),
      async (req, res) => {
        const event = await Event.findOneOrFail(req.params.eventid);
        // now check if the logged-in user belongs to the tenant that the event belongs to
        if (event.tenantId === req.params.tenantId) {
          const participants = await Participant.find({
            where: { eventId: req.params.eventid },
          });
          res.status(200).send(participants);
        } else {
          res.status(403).send({ error: 'Mismatch of tenant and event ID' });
        }
      }
    );

    app.delete(
      '/secure/tenants/:tenantId/events/:eventid/participants/:participantid',
      tenantCorrelationHandler(),
      async (req, res) => {
        const event = await Event.findOneOrFail(req.params.eventid);
        // now check if the logged-in user belongs to the tenant that the event belongs to
        if (event.tenantId === req.params.tenantId) {
          const participant = await Participant.findOneOrFail(
            req.params.participantid
          );
          if (participant.eventId === event.id) {
            Log.write(
              req.params.tenantId,
              UserService.username(req),
              `Teilnehmer mit ID ${participant.id} von Event ${event.id} gelöscht`
            );
            participant.remove();
            res.status(200).send();
          } else {
            res
              .status(400)
              .send({ error: 'Participant belongs to other event' });
          }
        } else {
          res.status(403).send({ error: 'Mismatch of tenant and event ID' });
        }
      }
    );

    app.put(
      '/secure/tenants/:tenantId/events/:eventid',
      tenantCorrelationHandler(),
      async (req, res) => {
        const eventI = req.body as EventI;
        const updatedEvent = await EventService.get().updateEvent(
          req.params.eventid,
          eventI
        );
        Log.write(
          req.params.tenantId,
          UserService.username(req),
          `Event ${updatedEvent.id} aktualisiert`
        );
        res.status(200).send(updatedEvent);
      }
    );

    app.put(
      '/secure/tenants/:tenantId/eventSeries/:eventSeriesId',
      tenantCorrelationHandler(),
      async (req, res) => {
        const eventI = req.body as EventI;
        const updatedEvents = await EventService.get().updateEventSeries(
          req.params.eventSeriesId,
          eventI
        );
        Log.write(
          req.params.tenantId,
          UserService.username(req),
          `Eventserie ${req.params.eventSeriesId} aktualisiert`
        );
        res.status(200).send(updatedEvents);
      }
    );

    app.put(
      '/secure/tenants/:tenantId/events/:id/disabled/:disabled',
      tenantCorrelationHandler(),
      async (req, res) => {
        const event = await Event.findOne(req.params.id);
        if (event) {
          // now check if the logged-in user belongs to the tenant that the event belongs to
          if (event.tenantId === req.params.tenantId) {
            event.disabled = req.params.disabled === 'true';
            event.save();
            Log.write(
              req.params.tenantId,
              UserService.username(req),
              `Event ${req.params.id} wurde auf ${
                event.disabled ? 'disabled' : 'enabled'
              } gesetzt`
            );
            res.status(200).send(event);
          } else {
            res
              .status(403)
              .send({ error: 'You Mismatch of tenant and event ID' });
          }
        } else {
          res.status(404).send({ error: 'Event not found' });
        }
      }
    );

    app.delete(
      '/secure/tenants/:tenantId/events/:id',
      tenantCorrelationHandler(),
      async (req, res) => {
        // first check if the event exists at all
        const eventToDelete = await Event.findOne(req.params.id);
        if (eventToDelete) {
          // now check if the logged-in user belongs to the tenant that the event belongs to
          if (eventToDelete.tenantId === req.params.tenantId) {
            EventService.get().deleteEvent(eventToDelete.id);
            Log.write(
              req.params.tenantId,
              UserService.username(req),
              `Event ${eventToDelete.id} gelöscht`
            );
            res.status(200).send({ message: 'Event deleted' });
          } else {
            res
              .status(403)
              .send({ error: 'You are not authorized to delete this event' });
          }
        } else {
          res.status(404).send({ error: 'Event not found' });
        }
      }
    );

    app.delete(
      '/secure/tenants/:tenantId/eventSeries/:id',
      tenantCorrelationHandler(),
      async (req, res) => {
        // first check if the event exists at all
        const eventSeriesToDelete = await EventSeries.findOne(req.params.id);
        if (eventSeriesToDelete) {
          // now check if the logged-in user belongs to the tenant that the event belongs to
          if (eventSeriesToDelete.tenantId === req.params.tenantId) {
            EventService.get().deleteEventSeries(eventSeriesToDelete.id);
            Log.write(
              req.params.tenantId,
              UserService.username(req),
              `Künftige Events der Serie ${eventSeriesToDelete.id} gelöscht`
            );
            res.status(200).send({ message: 'Event series deleted' });
          } else {
            res.status(403).send({
              error: 'You are not authorized to delete this event series',
            });
          }
        } else {
          res.status(404).send({ error: 'Event series not found' });
        }
      }
    );

    app.post('/events/:id/participant', async (req, res) => {
      const newParticipant = <ParticipantI>req.body;
      newParticipant.eventId = req.params.id;
      // check if there are still free seats on the event:
      const event = await Event.findOne(req.params.id);
      if (event === null) {
        // error, no such event
        res.status(404).send({ message: 'Event not found' });
      } else {
        // check if the related tenant is active. if not, respond with an error:
        const tenant = await Tenant.findOneOrFail(event.tenantId);
        if (!tenant.active) {
          return res.status(402).send({ error: 'Tenant not active' });
        }
        // now gather all information on the already reserved seats
        const participants = await Participant.find({
          where: { eventId: newParticipant.eventId },
        });
        if (event.maxSeats > participants.length) {
          const createdParticipant = new Participant();
          createdParticipant.firstname = newParticipant.firstname;
          createdParticipant.lastname = newParticipant.lastname;
          createdParticipant.email = newParticipant.email;
          createdParticipant.phone = newParticipant.phone;
          createdParticipant.street = newParticipant.street;
          createdParticipant.zip = newParticipant.zip;
          createdParticipant.city = newParticipant.city;
          createdParticipant.eventId = newParticipant.eventId;
          await createdParticipant.save();
          res.status(200).send(createdParticipant);
        } else {
          res.status(409).send({ message: 'All seats are taken already' });
        }
      }
    });
  }
}
