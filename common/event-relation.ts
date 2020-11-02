import { EventI } from './event';
import { EventSeriesI } from './event-series';
import { UserI } from './user';

export interface EventRelationI {
  id: string;
  user?: UserI;
  userId: string;
  event?: EventI;
  eventId: string;
  eventSeries?: EventSeriesI;
  eventSeriesId: string;
}
