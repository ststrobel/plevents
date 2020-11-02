import { EventSeriesI } from './event-series';

export interface EventI {
  name: string;
  date: Date;
  maxSeats: number;
  takenSeats: number;
  disabled: boolean;
  categoryId: string;
  singleOccurence: boolean;
  registrationOpenFrom: Date;
  eventSeries?: EventSeriesI;
}
