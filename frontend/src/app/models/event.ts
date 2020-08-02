import { EventI } from "../../../../common/event";
import { Injectable } from "@angular/core";
import { Adapter } from "../helpers/adapter";
import * as moment from "moment";
import { each, find } from "lodash";
import { environment } from "src/environments/environment";

export class Event implements EventI {
  id?: number;
  date: Date;
  maxSeats: number;
  takenSeats: number;
  name: string;
  weekDay: number;
  // time in seconds on that day
  time: number;
  disabled: boolean;

  downloadLink(): string {
    return `${environment.apiUrl}/secure/events/${this.id}/pdf`;
  }

  displayTime(): string {
    const m = moment(this.date);
    return m.format("ddd HH:mm");
  }

  isInPast(): boolean {
    const now = moment();
    return now.isAfter(moment(this.date));
  }

  static unique(events: Event[]): Event[] {
    const uniqueEvents = new Array<Event>();
    each(events, (event: Event) => {
      const identicalEvent = find(uniqueEvents, (uniqueEvent: Event) => {
        return (
          uniqueEvent.name === event.name &&
          uniqueEvent.weekDay === event.weekDay &&
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
  providedIn: "root",
})
export class EventAdapter implements Adapter<Event> {
  adapt(item: any): Event {
    const event = new Event();
    event.id = item.id;
    event.name = item.name;
    const m = moment(item.date);
    event.date = m.toDate();
    // compute the week day and the time in seconds on that day:
    event.weekDay = m.isoWeekday();
    event.time = m.hours() / 60 + m.minutes();
    event.maxSeats = item.maxSeats;
    event.takenSeats = item.takenSeats;
    event.disabled = item.disabled;
    return event;
  }
}
