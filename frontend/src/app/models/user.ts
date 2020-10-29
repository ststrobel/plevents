import { UserI } from '../../../../common/user';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';
import { EventRelation, EventRelationAdapter } from './event-relation';
import { each } from 'lodash';
import { Event } from './event';

export class User implements UserI {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  password: string;
  authdata?: string;
  active: boolean;
  eventRelations: EventRelation[];

  constructor(email: string) {
    this.email = email;
  }

  public hasAccessToEvent(eventOrEventId: string | Event): boolean {
    if (typeof eventOrEventId === 'string') {
      const eventId = eventOrEventId;
      return (
        this.eventRelations &&
        (this.eventRelations.find(relation => relation.eventId === eventId) !==
          undefined ||
          this.eventRelations.find(
            relation => relation.eventSeriesId === eventId
          ) !== undefined)
      );
    } else {
      return (
        this.eventRelations &&
        (this.eventRelations.find(
          relation => relation.eventId === eventOrEventId.id
        ) !== undefined ||
          (eventOrEventId.eventSeries &&
            this.eventRelations.find(
              relation =>
                relation.eventSeriesId === eventOrEventId.eventSeries.id
            ) !== undefined))
      );
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class UserAdapter implements Adapter<User> {
  constructor(private eventRelationAdapter: EventRelationAdapter) {}
  adapt(item: any): User {
    const u = new User(item.email);
    u.id = item.id;
    u.name = item.name;
    u.tenantId = item.tenantId;
    u.active = item.active;
    u.eventRelations = [];
    if (item.eventRelations) {
      each(item.eventRelations, rel => {
        u.eventRelations.push(this.eventRelationAdapter.adapt(rel));
      });
    }
    return u;
  }
}
