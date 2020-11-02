import { each, find } from 'lodash';
import moment from 'moment';
import { getConnection } from 'typeorm';
import { EventI } from '../../../common/event';
import { Event } from '../models/event';
import { EventSeries } from '../models/event-series';
import { Participant } from '../models/participant';

export class EventService {
  private static singleton: EventService = null;

  /**
   * get the service instance
   */
  static get(): EventService {
    if (EventService.singleton === null) {
      EventService.singleton = new EventService();
    }
    return EventService.singleton;
  }

  async getEvents(
    tenantId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Event[]> {
    // first, get all events
    let query = getConnection()
      .createQueryBuilder()
      .select('event')
      .from(Event, 'event')
      .where(`tenantId = '${tenantId}'`);
    // construct the where clause
    if (fromDate) {
      query = query.andWhere(`DATE(date) >= '${fromDate}'`);
    }
    if (toDate) {
      query = query.andWhere(`DATE(date) <= '${toDate}'`);
    }
    query = query.orWhere(`DATE(registrationOpenFrom) <= now()`);
    query = query.andWhere(`tenantId = '${tenantId}'`);
    const allEvents = await query.getMany();
    // also, get all possibly related eventseries objects for series events
    const eventSeriesPromises = new Array<Promise<any>>();
    each(allEvents, event => {
      if (event.eventSeriesId) {
        EventSeries.findOne(event.eventSeriesId).then(
          (eventSeries: EventSeries) => {
            event.eventSeries = eventSeries;
          }
        );
      }
    });
    await Promise.all(eventSeriesPromises);

    // then, retrieve the participants per event
    const promises: Promise<Participant[]>[] = [];
    each(allEvents, (event: Event) => {
      promises.push(Participant.find({ where: { eventId: event.id } }));
      event.takenSeats = 0;
    });
    // return events with participants count
    const allParticipantsForEvents = await Promise.all(promises);
    each(allParticipantsForEvents, (participantsPerEvent: Participant[]) => {
      if (participantsPerEvent.length > 0) {
        find(allEvents, {
          id: participantsPerEvent[0].eventId,
        }).takenSeats = participantsPerEvent.length;
      }
    });
    return allEvents;
  }

  async addEvent(tenantId: string, eventI: EventI): Promise<Event> {
    const event = new Event();
    event.name = eventI.name;
    event.date = eventI.date;
    event.categoryId = eventI.categoryId;
    event.maxSeats = eventI.maxSeats;
    event.tenantId = tenantId;
    event.singleOccurence = eventI.singleOccurence;
    event.registrationOpenFrom = eventI.registrationOpenFrom;
    return await event.save();
  }

  async addEventSeries(tenantId: string, eventI: EventI): Promise<EventSeries> {
    // first, create an event series object then then the single events afterwards
    const eventSeries = new EventSeries();
    eventSeries.categoryId = eventI.categoryId;
    eventSeries.name = eventI.name;
    eventSeries.tenantId = tenantId;
    await eventSeries.save();
    // now create the single events until the end of the year
    const startDate = moment(eventI.date);
    for (
      let cw = startDate.isoWeek();
      cw <= moment().date(31).month(11).isoWeek();
      cw++
    ) {
      const event = new Event();
      event.singleOccurence = false;
      event.eventSeries = eventSeries;
      event.name = eventI.name;
      event.categoryId = eventI.categoryId;
      event.maxSeats = eventI.maxSeats;
      event.date = startDate.isoWeek(cw).toDate();
      event.tenantId = tenantId;
      event.save();
    }
    return eventSeries;
  }

  /**
   * update a specific event, identified by its ID, with data transported in the eventI DTO
   * @param eventId
   * @param eventI
   */
  async updateEvent(eventId: string, eventI: EventI): Promise<Event> {
    const eventToUpdate = await Event.findOneOrFail(eventId);
    return this.update(eventToUpdate, eventI);
  }

  private update(existingEvent: Event, eventI: EventI): Promise<Event> {
    existingEvent.name = eventI.name;
    existingEvent.date = eventI.date;
    existingEvent.categoryId = eventI.categoryId;
    existingEvent.maxSeats = eventI.maxSeats;
    if (existingEvent.singleOccurence) {
      existingEvent.registrationOpenFrom = eventI.registrationOpenFrom;
    }
    return existingEvent.save();
  }

  /**
   * update an event series based on one of the (future) events in this series
   * @param eventI
   */
  async updateEventSeries(
    eventSeriesId: string,
    eventI: EventI
  ): Promise<Event[]> {
    // update the series itself (name and category potentially)
    const eventSeries = await EventSeries.findOneOrFail(eventSeriesId);
    eventSeries.name = eventI.name;
    eventSeries.categoryId = eventI.categoryId;
    await eventSeries.save();
    // now load all FUTURE events for this series
    const query = getConnection()
      .createQueryBuilder()
      .select('event')
      .from(Event, 'event')
      .where(`eventSeriesId = '${eventSeriesId}'`)
      .andWhere(`date > NOW()`);
    const allFutureSeriesEvents = await query.getMany();
    // now update those events, too
    const updatePromises = new Array<Promise<Event>>();
    const newWeekDay = moment(eventI.date).isoWeekday();
    const newHour = moment(eventI.date).hours();
    const newMinutes = moment(eventI.date).minutes();
    each(allFutureSeriesEvents, event => {
      // we must check if the date and/or time have changed. if so, we must dynamically calculate the new date/time for each event
      const date = moment(event.date);
      date.isoWeekday(newWeekDay);
      date.hours(newHour);
      date.minutes(newMinutes);
      eventI.date = date.toDate();
      updatePromises.push(this.update(event, eventI));
    });
    return Promise.all(allFutureSeriesEvents);
  }

  /**
   * deletes a single event - when it is not in the past!
   * @param eventId
   */
  async deleteEvent(eventId: string): Promise<void> {
    const event = await Event.findOne(eventId);
    if (moment(event.date).isAfter(moment())) {
      event.remove();
    }
  }

  /**
   * deletes an event series - but only the events that are in the future
   * @param eventId
   */
  async deleteEventSeries(eventSeriesId: string): Promise<void> {
    const futureSeriesEvents = await getConnection()
      .createQueryBuilder()
      .select('event')
      .from(Event, 'event')
      .where(`eventSeriesId = '${eventSeriesId}'`)
      .andWhere(`date > NOW()`)
      .getMany();
    Event.remove(futureSeriesEvents);
  }
}
