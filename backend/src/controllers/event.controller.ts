import * as express from 'express';
import { Event } from '../models/event';
import { ParticipantI } from '../../../common/participant';
import { EventI } from '../../../common/event';
import { Participant } from '../models/participant';
import { each, find } from 'lodash';
import { Log } from '../models/log';
import { UserService } from '../services/user.service';
import { getConnection } from 'typeorm';
import { Tenant } from '../models/tenant';
import tenantCorrelationHandler from '../handlers/tenant-correlation-handler';

export class EventController {
  private static async handleGetEvents(req, res): Promise<void> {
    // first, get all events
    let query = getConnection()
      .createQueryBuilder()
      .select('event')
      .from(Event, 'event')
      .where(`tenantId = '${req.params.tenantId}'`);
    // construct the where clause
    if (req.query.start) {
      query = query.andWhere(`date >= '${req.query.start}'`);
    }
    if (req.query.end) {
      query = query.andWhere(`date <= '${req.query.end}'`);
    }
    const allEvents = await query.getMany();

    // then, retrieve the participants per event
    const promises = [];
    each(allEvents, (event: Event) => {
      promises.push(Participant.find({ where: { eventId: event.id } }));
      event.takenSeats = 0;
    });
    // return events with participants count
    Promise.all(promises).then(
      (allParticipantsForEvents: Participant[][]) => {
        each(
          allParticipantsForEvents,
          (participantsPerEvent: Participant[]) => {
            if (participantsPerEvent.length > 0) {
              find(allEvents, {
                id: participantsPerEvent[0].eventId,
              }).takenSeats = participantsPerEvent.length;
            }
          }
        );
        res.send(allEvents);
      },
      (err: any) => {
        res
          .status(500)
          .send({ message: `Error calculating taken seats: ${err}` });
      }
    );
  }

  public static register(app: express.Application): void {
    app.get('/tenants/:tenantId/events', async (req, res) => {
      // check if the related tenant is active. if not, respond with an error:
      const tenant = await Tenant.findOneOrFail(req.params.tenantId);
      if (!tenant.active) {
        return res.status(402).send({ error: 'Tenant not active' });
      }
      EventController.handleGetEvents(req, res);
    });

    app.get('/secure/tenants/:tenantId/events', async (req, res) => {
      EventController.handleGetEvents(req, res);
    });

    app.post(
      '/secure/tenants/:tenantId/events',
      tenantCorrelationHandler,
      async (req, res) => {
        const eventToCreate = <EventI>req.body;
        const event = new Event();
        event.name = eventToCreate.name;
        event.date = eventToCreate.date;
        event.categoryId = eventToCreate.categoryId;
        event.maxSeats = eventToCreate.maxSeats;
        event.tenantId = req.params.tenantId;
        await event.save();
        Log.write(
          event.tenantId,
          UserService.currentUser(req),
          `Event ${event.id} erstellt`
        );
        res.status(200).send(event);
      }
    );

    app.get(
      '/secure/tenants/:tenantId/events/:eventid/participants',
      tenantCorrelationHandler,
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
      tenantCorrelationHandler,
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
              UserService.currentUser(req),
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
      tenantCorrelationHandler,
      async (req, res) => {
        const eventToUpdate = await Event.findOneOrFail(req.params.eventid);
        eventToUpdate.name = req.body.name;
        eventToUpdate.date = req.body.date;
        eventToUpdate.categoryId = req.body.categoryId;
        eventToUpdate.maxSeats = req.body.maxSeats;
        await eventToUpdate.save();
        Log.write(
          req.params.tenantId,
          UserService.currentUser(req),
          `Event ${eventToUpdate.id} aktualisiert`
        );
        res.status(200).send(eventToUpdate);
      }
    );

    app.put(
      '/secure/tenants/:tenantId/events/:id/disabled/:disabled',
      tenantCorrelationHandler,
      async (req, res) => {
        const event = await Event.findOne(req.params.id);
        if (event) {
          // now check if the logged-in user belongs to the tenant that the event belongs to
          if (event.tenantId === req.params.tenantId) {
            event.disabled = req.params.disabled === 'true';
            event.save();
            Log.write(
              req.params.tenantId,
              UserService.currentUser(req),
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
      tenantCorrelationHandler,
      async (req, res) => {
        // first check if the event exists at all
        const eventToDelete = (await Event.findOne(req.params.id)) as Event;
        if (eventToDelete) {
          // now check if the logged-in user belongs to the tenant that the event belongs to
          if (eventToDelete.tenantId === req.params.tenantId) {
            getConnection()
              .createQueryBuilder()
              .delete()
              .from(Event)
              .where(`id = '${req.params.id}'`)
              .execute();
            Log.write(
              req.params.tenantId,
              UserService.currentUser(req),
              `Event ${req.params.id} gelöscht`
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
