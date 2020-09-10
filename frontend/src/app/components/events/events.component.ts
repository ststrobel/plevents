import { Component, OnInit } from '@angular/core';
import { EventService } from 'src/app/services/event.service';
import { Week } from 'src/app/models/week';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { sortBy, each, filter, find, uniq, map, clone } from 'lodash';
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
  weeks: Week[] = null;
  uniqueEvents: Event[] = null;
  eventsInTimeframe: Event[] = new Array<Event>();
  timeColumns: string[] = new Array<string>();
  registerForm: FormGroup;
  selectedEvent: Event = null;
  successfullyRegistered = false;
  classOptions: string[] = null;
  selectedClass: string = null;
  consentTeaser1: string = null;
  consentTeaser2: string = null;
  consentText1: string = null;
  consentText2: string = null;
  consentText1Shown: boolean = false;
  consentText2Shown: boolean = false;

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
        this.consentTeaser1 = tenant.consentTeaser1;
        this.consentText1 = tenant.consentText1;
        if (this.consentTeaser1 && this.consentTeaser1.length > 0) {
          // only add the form control if it is not existing yet
          if (!this.registerForm.contains('consent1')) {
            this.registerForm.addControl(
              'consent1',
              new FormControl(false, Validators.required)
            );
          }
        } else {
          this.registerForm.removeControl('consent1');
        }
        this.consentTeaser2 = tenant.consentTeaser2;
        this.consentText2 = tenant.consentText2;
        if (this.consentTeaser2 && this.consentTeaser2.length > 0) {
          // only add the form control if it is not existing yet
          if (!this.registerForm.contains('consent2')) {
            this.registerForm.addControl(
              'consent2',
              new FormControl(false, Validators.required)
            );
          }
        } else {
          this.registerForm.removeControl('consent2');
        }
      }
    });
  }

  loadEvents(): void {
    this.timeColumns = new Array<string>();
    const today = moment();
    const start = today.clone(); //.startOf('week').add(1, 'week');
    const end = today.clone().endOf('week').add(1, 'week');
    this.eventService
      .getEvents(this.tenantService.currentTenantValue.id, start, end)
      .subscribe((events: Event[]) => {
        // filter out all events that are disabled
        this.eventsInTimeframe = filter(events, { disabled: false });
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
        this.weeks = new Array<Week>(2);
      });
  }

  selectClass(className: string): void {
    this.selectedClass = className;
    this.selectedEvent = null;
    this.registerForm.markAsUntouched();
    this.weeks[0] = new Week(moment().isoWeek());
    this.weeks[1] = new Week(moment().add(1, 'week').isoWeek());
    this.determineUniqueEvents(className);
    const eventsToDisplay = <Event[]>(
      filter(this.eventsInTimeframe, (event: Event) => {
        if (className === 'alle') {
          return true;
        }
        return event.targetClass.split(',').indexOf(className) >= 0;
      })
    );
    const today = moment();
    const startOfWeek = today.clone().startOf('week');
    const endOfWeek = today.clone().endOf('week');
    this.weeks[0].events = new Array<Event>(this.uniqueEvents.length);
    this.weeks[1].events = new Array<Event>(this.uniqueEvents.length);
    each(eventsToDisplay, (event: Event) => {
      // find out at which position to display the event
      each(this.uniqueEvents, (uniqueEvent: Event, index: number) => {
        if (
          uniqueEvent.displayName() === event.displayName() &&
          uniqueEvent.weekDay === event.weekDay &&
          uniqueEvent.displayTime() === event.displayTime()
        ) {
          // check if its in this week or next week
          if (
            moment(event.date).isBetween(
              startOfWeek,
              endOfWeek,
              undefined,
              '[]'
            )
          ) {
            // this week
            this.weeks[0].events[index] = event;
          } else {
            // next week
            this.weeks[1].events[index] = event;
          }
        }
      });
    });
  }

  private determineUniqueEvents(className: string): void {
    this.uniqueEvents = new Array<Event>();
    each(this.eventsInTimeframe, (event: Event) => {
      if (
        className === 'alle' ||
        event.targetClass.split(',').indexOf(className) >= 0
      ) {
        // check if there is already an instance of this event displayed
        if (
          find(this.uniqueEvents, (uniqueEvent: Event) => {
            return (
              uniqueEvent.displayName() === event.displayName() &&
              uniqueEvent.weekDay === event.weekDay &&
              uniqueEvent.displayTime() === event.displayTime()
            );
          }) === undefined
        ) {
          this.uniqueEvents.push(event);
        }
      }
    });
    this.uniqueEvents = sortBy(this.uniqueEvents, ['weekDay', 'time']);
  }

  private createRegisterForm(): void {
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
