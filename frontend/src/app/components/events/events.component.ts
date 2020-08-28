import { Component, OnInit } from '@angular/core';
import { EventService } from 'src/app/services/event.service';
import { Week } from 'src/app/models/week';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { sortBy, each, filter, find, uniq, map } from 'lodash';
import * as moment from 'moment';
import { Event } from 'src/app/models/event';
import { Participant } from 'src/app/models/participant';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
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
  consentText: string = null;

  constructor(
    private eventService: EventService,
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // load the tenant information and redirect in case tenant path does not exist:
    this.tenantService
      .getByPath(this.route.snapshot.params.tenantPath)
      .subscribe(null, error => {
        if (
          error === 'Not Found' ||
          (error instanceof HttpErrorResponse && error.status === 404)
        ) {
          this.router.navigate(['fehler', 'account-not-found']);
        }
      });
    this.createRegisterForm();
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant) {
        this.loadEvents();
        this.consentText = tenant.consentText;
        if (this.consentText && this.consentText.length > 0) {
          // only add the form control if it is not existing yet
          if (!this.registerForm.contains('consent')) {
            this.registerForm.addControl(
              'consent',
              new FormControl(false, Validators.required)
            );
          }
        } else {
          this.registerForm.removeControl('consent');
        }
      }
    });
  }

  eventAt(time: string, events: Event[]): Event {
    const match = find(events, (event: Event) => {
      return event.displayTime() === time;
    });
    return match;
  }

  loadEvents(): void {
    this.timeColumns = new Array<string>();
    this.eventService
      .getEvents(this.tenantService.currentTenantValue.id)
      .subscribe((events: Event[]) => {
        // filter out all events that are disabled
        events = filter(events, { disabled: false });
        this.eventsInTimeframe = this.eventsInNextWeek(events);
        // first, check for what classes we have events:
        this.classOptions = new Array<string>();
        this.classOptions.push(
          ...filter(
            uniq(
              map(this.eventsInTimeframe, 'targetClass').join(',').split(',')
            ) as string[],
            (targetClass: string) =>
              targetClass !== null &&
              targetClass.length > 0 &&
              targetClass !== 'alle'
          )
        );
        // sort the values
        this.classOptions = this.classOptions.sort();
        // add 'alle' at the top
        this.classOptions.unshift('alle');
        this.week = new Week(moment().isoWeek());
      });
  }

  selectClass(className: string): void {
    this.selectedClass = className;
    this.selectedEvent = null;
    this.registerForm.markAsUntouched();
    this.week.events = <Event[]>(
      filter(this.eventsInTimeframe, (event: Event) => {
        if (className === 'alle') {
          return true;
        }
        return event.targetClass.split(',').indexOf(className) >= 0;
      })
    );
    this.week.events = sortBy(this.week.events, ['weekDay', 'time']);
    this.timeColumns = [];
    each(this.week.events, (event: Event) => {
      this.timeColumns.push(event.displayTime());
    });
  }

  eventsInNextWeek(events: Event[]): Event[] {
    const today = moment();
    const start = today.clone().startOf('week').add(1, 'week');
    const end = today.clone().endOf('week').add(1, 'week');
    return filter(events, (event: Event) => {
      return moment(event.date).isBetween(start, end, undefined, '[]');
    });
  }

  createRegisterForm(): void {
    this.registerForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', Validators.required),
      street: new FormControl('', Validators.required),
      zip: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
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
    participant.name = this.registerForm.get('name').value;
    participant.email = this.registerForm.get('email').value;
    participant.phone = this.registerForm.get('phone').value;
    participant.street = this.registerForm.get('street').value;
    participant.zip = this.registerForm.get('zip').value;
    participant.city = this.registerForm.get('city').value;
    participant.eventId = this.selectedEvent.id;
    this.eventService.addParticipant(participant).subscribe(() => {
      this.successfullyRegistered = true;
      this.registerForm.reset();
    });
  }
}
