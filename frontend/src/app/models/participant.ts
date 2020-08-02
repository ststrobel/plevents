import { ParticipantI } from "../../../../common/participant";
import { Injectable } from "@angular/core";
import { Adapter } from "../helpers/adapter";

export class Participant implements ParticipantI {
  email: string;
  phone: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  EventId: number;
}

@Injectable({
  providedIn: "root",
})
export class ParticipantAdapter implements Adapter<Participant> {
  adapt(item: any): Participant {
    const participant = new Participant();
    participant.name = item.name;
    participant.email = item.email;
    participant.phone = item.phone;
    participant.street = item.street;
    participant.zip = item.zip;
    participant.city = item.city;
    participant.EventId = item.eventId;
    return participant;
  }
}
