import { ParticipantI } from '../../../../common/participant';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';

export class Participant implements ParticipantI {
  id?: number;
  email: string;
  phone: string;
  firstname: string;
  lastname: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  eventId: string;
}

@Injectable({
  providedIn: 'root',
})
export class ParticipantAdapter implements Adapter<Participant> {
  adapt(item: any): Participant {
    const participant = new Participant();
    participant.id = item.id;
    participant.firstname = item.firstname;
    participant.lastname = item.lastname;
    participant.name = item.name;
    participant.email = item.email;
    participant.phone = item.phone;
    participant.street = item.street;
    participant.zip = item.zip;
    participant.city = item.city;
    participant.eventId = item.eventId;
    return participant;
  }
}
