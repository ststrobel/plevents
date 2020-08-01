import { ParticipantI } from "../../../../common/participant";
import { Injectable } from "@angular/core";
import { Adapter } from "../helpers/adapter";

export class Participant implements ParticipantI {
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
    participant.street = item.street;
    participant.zip = item.zip;
    participant.city = item.city;
    participant.EventId = item.eventId;
    return participant;
  }
}
