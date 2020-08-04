import { Component, OnInit } from "@angular/core";
import { EventService } from "src/app/services/event.service";
import { Week } from "src/app/models/week";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { sortBy, each, filter, find } from "lodash";
import * as moment from "moment";
import { Event } from "src/app/models/event";
import { Participant } from "src/app/models/participant";
import { HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-events",
  templateUrl: "./events.component.html",
  styleUrls: ["./events.component.scss"],
})
export class EventsComponent implements OnInit {
  weeks: Week[] = new Array<Week>();
  uniqueEvents: Event[] = new Array<Event>();
  timeColumns: string[] = new Array<string>();
  registerForm: FormGroup;
  selectedEvent: Event = null;
  successfullyRegistered = false;

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.createRegisterForm();
    this.loadEvents();
  }

  eventAt(time: string, events: Event[]): Event {
    const match = find(events, (event: Event) => {
      return event.displayTime() === time;
    });
    return match;
  }

  loadEvents(): void {
    this.weeks = new Array<Week>();
    this.uniqueEvents = new Array<Event>();
    this.timeColumns = new Array<string>();
    this.eventService.getEvents().subscribe((events: Event[]) => {
      // filter out all events that are disabled
      events = filter(events, { disabled: false });
      events = this.eventsInThisAndNextWeek(events);
      this.uniqueEvents = Event.unique(events);
      this.uniqueEvents = sortBy(this.uniqueEvents, ["weekDay", "time"]);
      each(this.uniqueEvents, (event: Event) => {
        this.timeColumns.push(event.displayTime());
      });
      // prepare the weeks, calculate the past 3 weeks until the end of the year:
      const today = moment();
      const startOfWeek = today.clone().startOf("week");
      const endOfWeek = today.clone().endOf("week");
      let week = new Week(startOfWeek.isoWeek());
      // add all events for this week
      week.events = filter(events, (event: Event) => {
        return moment(event.date).isBetween(
          startOfWeek,
          endOfWeek,
          undefined,
          "[]"
        );
      });
      this.weeks.push(week);
      startOfWeek.add(1, "week");
      endOfWeek.add(1, "week");
      week = new Week(startOfWeek.isoWeek());
      // add all events for next week
      week.events = filter(events, (event: Event) => {
        return moment(event.date).isBetween(
          startOfWeek,
          endOfWeek,
          undefined,
          "[]"
        );
      });
      this.weeks.push(week);
    });
  }

  eventsInThisAndNextWeek(events: Event[]): Event[] {
    const today = moment();
    const start = today.clone().startOf("week");
    const end = today.clone().endOf("week").add(1, "week");
    return filter(events, (event: Event) => {
      return moment(event.date).isBetween(start, end, undefined, "[]");
    });
  }

  createRegisterForm(): void {
    this.registerForm = new FormGroup({
      name: new FormControl("", Validators.required),
      email: new FormControl("", [Validators.required, Validators.email]),
      phone: new FormControl("", Validators.required),
      street: new FormControl("", Validators.required),
      zip: new FormControl("", Validators.required),
      city: new FormControl("", Validators.required),
    });
  }

  availableSeatsText(event: Event): string {
    const free = event.maxSeats - event.takenSeats;
    if (free > 3) {
      return `${free} freie Plätze`;
    }
    if (free > 1) {
      return `nur ${free} freie Plätze`;
    }
    return `noch 1 freier Platz`;
  }

  selectEvent(event: Event): void {
    if (this.selectedEvent === event) {
      this.selectedEvent = null;
    } else {
      this.selectedEvent = event;
    }
  }

  registerParticipant(): void {
    if (this.registerForm.invalid) {
      return;
    }
    const participant = new Participant();
    participant.name = this.registerForm.get("name").value;
    participant.email = this.registerForm.get("email").value;
    participant.phone = this.registerForm.get("phone").value;
    participant.street = this.registerForm.get("street").value;
    participant.zip = this.registerForm.get("zip").value;
    participant.city = this.registerForm.get("city").value;
    participant.EventId = this.selectedEvent.id;
    this.eventService.addParticipant(participant).subscribe(() => {
      this.successfullyRegistered = true;
      this.registerForm.reset();
      this.selectedEvent = null;
      this.loadEvents();
    });
  }
}
