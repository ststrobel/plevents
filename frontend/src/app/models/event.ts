import { EventI } from '../../../../common/event';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import * as moment from 'moment';
import { each, find } from 'lodash';
import { environment } from 'src/environments/environment';

export class Event implements EventI {
  id?: string;
  date: Date;
  maxSeats: number;
  takenSeats: number;
  name: string;
  categoryId: string;
  weekDay: number;
  // time in seconds on that day
  time: number;
  disabled: boolean;
  tenantId: string;
  singleOccurence: boolean;
  registrationOpenFrom: Date;

  downloadLink(): string {
    return `${environment.apiUrl}/secure/events/${this.id}/pdf`;
  }

  displayName(): string {
    return this.name;
  }

  displayTime(includeWeekDay: boolean = true): string {
    const m = moment(this.date);
    if (this.singleOccurence) {
      return m.format('DD.MM. (ddd) HH:mm');
    }
    if (includeWeekDay) {
      return m.format('ddd HH:mm');
    }
    return m.format('HH:mm');
  }

  displayDate(): string {
    const m = moment(this.date);
    return m.format('DD.MM.');
  }

  isInPast(): boolean {
    const now = moment();
    return now.isAfter(moment(this.date));
  }

  /**
   * returns all unique events based on name, weekDay, targetClass and time
   * @param events
   */
  static unique(events: Event[]): Event[] {
    const uniqueEvents = new Array<Event>();
    each(events, (event: Event) => {
      const identicalEvent = find(uniqueEvents, (uniqueEvent: Event) => {
        return (
          uniqueEvent.name === event.name &&
          uniqueEvent.weekDay === event.weekDay &&
          uniqueEvent.categoryId === event.categoryId &&
          uniqueEvent.time === event.time
        );
      });
      if (identicalEvent === undefined) {
        uniqueEvents.push(event);
      }
    });
    return uniqueEvents;
  }
}

@Injectable({
  providedIn: 'root',
})
export class EventAdapter implements Adapter<Event> {
  adapt(item: any): Event {
    const event = new Event();
    event.id = item.id;
    event.name = item.name;
    event.categoryId = item.categoryId;
    const m = moment(item.date);
    event.date = m.toDate();
    // compute the week day and the time in minutes on that day:
    event.weekDay = m.isoWeekday();
    event.time = m.hours() / 60 + m.minutes();
    event.maxSeats = item.maxSeats;
    event.takenSeats = item.takenSeats;
    event.disabled = item.disabled;
    event.tenantId = item.tenantId;
    event.singleOccurence = item.singleOccurence;
    if (item.registrationOpenFrom) {
      event.registrationOpenFrom = moment(item.registrationOpenFrom).toDate();
    }
    return event;
  }
}
