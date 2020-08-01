import { Event } from "./event";

export class Week {
  number: number;
  events: Event[] = new Array<Event>();

  constructor(number: number) {
    this.number = number;
  }
}
