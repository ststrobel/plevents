import { EventRelationI } from '../../../../common/event-relation';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { User } from './user';
import { Event } from './event';
import { EventSeriesI } from '../../../../common/event-series';

export class EventRelation implements EventRelationI {
  id: string;
  user?: User;
  userId: string;
  event?: Event;
  eventId: string;
  eventSeries?: EventSeriesI;
  eventSeriesId: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventRelationAdapter implements Adapter<EventRelation> {
  adapt(item: any): EventRelation {
    const relation = new EventRelation();
    relation.id = item.id;
    relation.userId = item.userId;
    relation.eventId = item.eventId;
    relation.eventSeriesId = item.eventSeriesId;
    return relation;
  }
}
