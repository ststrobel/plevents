import { Component, OnInit } from "@angular/core";
import { EventService } from "src/app/services/event.service";
import { Week } from "src/app/models/week";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { sortBy, each, filter, find, uniq, map } from "lodash";
import * as moment from "moment";
import { Event } from "src/app/models/event";
import { Participant } from "src/app/models/participant";

@Component({
  selector: "app-events",
  templateUrl: "./events.component.html",
  styleUrls: ["./events.component.scss"],
})
export class EventsComponent implements OnInit {
  week: Week = null;
  eventsInTimeframe: Event[] = new Array<Event>();
  timeColumns: string[] = new Array<string>();
  registerForm: FormGroup;
  selectedEvent: Event = null;
  successfullyRegistered = false;
  classOptions: string[] = null;
  selectedClass: string = null;

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
    this.timeColumns = new Array<string>();
    this.eventService.getEvents().subscribe((events: Event[]) => {
      // filter out all events that are disabled
      events = filter(events, { disabled: false });
      this.eventsInTimeframe = this.eventsInNextWeek(events);
      // first, check for what classes we have events:
      this.classOptions = new Array<string>();
      this.classOptions.push("alle");
      this.classOptions.push(
        ...filter(
          <string[]>uniq(map(this.eventsInTimeframe, "targetClass")),
          (targetClass: string) =>
            targetClass !== null &&
            targetClass.length > 0 &&
            targetClass !== "alle"
        )
      );
      this.week = new Week(moment().isoWeek());
    });
  }

  selectClass(className: string): void {
    this.selectedClass = className;
    this.selectedEvent = null;
    this.registerForm.markAsUntouched();
    this.week.events = <Event[]>(
      filter(this.eventsInTimeframe, (event: Event) => {
        if (className === "alle") {
          return true;
        }
        return event.targetClass === className;
      })
    );
    this.week.events = sortBy(this.week.events, ["weekDay", "time"]);
    this.timeColumns = [];
    each(this.week.events, (event: Event) => {
      this.timeColumns.push(event.displayTime());
    });
  }

  eventsInNextWeek(events: Event[]): Event[] {
    const today = moment();
    const start = today.clone().startOf("week").add(1, "week");
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
      consent: new FormControl(false, Validators.required),
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
    this.registerForm.markAsUntouched();
    if (this.selectedEvent === event) {
      this.selectedEvent = null;
    } else {
      this.selectedEvent = event;
    }
  }

  isInvalid(formControlName: string): boolean {
    return (
      this.registerForm.get(formControlName).invalid &&
      this.registerForm.get(formControlName).touched
    );
  }

  registerParticipant(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const participant = new Participant();
    participant.name = this.registerForm.get("name").value;
    participant.email = this.registerForm.get("email").value;
    participant.phone = this.registerForm.get("phone").value;
    participant.street = this.registerForm.get("street").value;
    participant.zip = this.registerForm.get("zip").value;
    participant.city = this.registerForm.get("city").value;
    participant.eventId = this.selectedEvent.id;
    this.eventService.addParticipant(participant).subscribe(() => {
      this.successfullyRegistered = true;
      this.registerForm.reset();
    });
  }
}
