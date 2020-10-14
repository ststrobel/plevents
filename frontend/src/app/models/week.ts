import { Event } from './event';

export class Week {
  number: number;
  startOfWeek: moment.Moment;
  endOfWeek: moment.Moment;
  events: Event[] = new Array<Event>();

  constructor(number: number) {
    this.number = number;
  }
}
