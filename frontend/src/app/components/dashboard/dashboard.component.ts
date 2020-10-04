import { Component, OnInit } from '@angular/core';
import { Week } from 'src/app/models/week';
import { EventService } from 'src/app/services/event.service';
import { Event } from '../../models/event';
import * as moment from 'moment';
import { filter, sortBy, each, find } from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private allEvents: Event[];
  weeks: Week[] = new Array<Week>();
  uniqueEvents: Event[] = new Array<Event>();
  newEventForm: FormGroup;
  operationOngoing: boolean = false;
  newEventFormShown: boolean = false;
  eventsOpened: boolean[];

  constructor(
    private eventService: EventService,
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.eventsOpened = new Array<boolean>();
    // load the tenant information and redirect in case tenant path does not exist:
    this.tenantService
      .getByPath(this.route.snapshot.params.tenantPath)
      .subscribe(
        () => {},
        error => {
          if (
            error === 'Not Found' ||
            (error instanceof HttpErrorResponse && error.status === 404)
          ) {
            this.router.navigate(['fehler', 'account-not-found']);
          }
        }
      );
    this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant) {
        this.loadAllEvents(tenant);
      }
    });
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.createNewEventForm();
  }

  currentCW(): number {
    return moment().isoWeek();
  }

  loadAllEvents(tenant: Tenant): void {
    this.eventService.getEvents(tenant.id).subscribe((events: Event[]) => {
      this.weeks = new Array<Week>();
      this.uniqueEvents = new Array<Event>();
      this.allEvents = events;
      this.uniqueEvents = Event.unique(this.allEvents);
      const sortOrder = ['weekDay', 'time', 'name', 'targetClass'];
      this.uniqueEvents = sortBy(this.uniqueEvents, sortOrder);
      // prepare the weeks, calculate the past 3 weeks until the end of the year:
      const today = moment();
      const weekNumberThreeWeeksAgo = today.clone().subtract(3, 'weeks').week();
      const startOfWeekThreeWeeksAgo = today
        .clone()
        .startOf('week')
        .subtract(3, 'weeks');
      const endOfWeekThreeWeeksAgo = today
        .clone()
        .endOf('week')
        .subtract(3, 'weeks');
      for (let kw = today.week() - 3; kw <= 52; kw++) {
        const week = new Week(kw);
        const weekStart = startOfWeekThreeWeeksAgo
          .clone()
          .add(kw - weekNumberThreeWeeksAgo, 'weeks');
        const weekEnd = endOfWeekThreeWeeksAgo
          .clone()
          .add(kw - weekNumberThreeWeeksAgo, 'weeks');
        // add all events for this week
        const eventsInThisWeek = filter(events, (event: Event) => {
          return moment(event.date).isBetween(
            weekStart,
            weekEnd,
            undefined,
            '[]'
          );
        });
        // match the event instances in this week to their according event
        // this is necessary in case in a specific week an event is not existent
        week.events = new Array<Event>(this.uniqueEvents.length);
        each(this.uniqueEvents, (uniqueEvent: Event, index: number) => {
          week.events[index] = find(eventsInThisWeek, {
            name: uniqueEvent.name,
            weekDay: uniqueEvent.weekDay,
            time: uniqueEvent.time,
            targetClass: uniqueEvent.targetClass,
          });
        });
        this.weeks.push(week);
      }
    });
  }

  createNewEventForm(): void {
    this.newEventForm = new FormGroup({
      name: new FormControl('', Validators.required),
      class: new FormControl(''),
      fromDate: new FormControl('', Validators.required),
      time: new FormControl('', Validators.required),
      maxSeats: new FormControl('', Validators.required),
    });
  }

  addNewEvent(): void {
    if (!this.newEventForm.valid) {
      this.newEventForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const m = moment(this.newEventForm.get('fromDate').value);
    const time = <string>this.newEventForm.get('time').value;
    m.hours(parseInt(time.split(':')[0]));
    m.minutes(parseInt(time.split(':')[1]));
    const currentWeek = m.week();
    // add the event for all following calendar weeks until the end of the year:
    const observables = [];
    for (let cw = currentWeek; cw <= 52; cw++) {
      const event = new Event();
      event.name = this.newEventForm.get('name').value;
      event.targetClass = this.newEventForm.get('class').value;
      event.maxSeats = this.newEventForm.get('maxSeats').value;
      event.date = m.toDate();
      observables.push(this.eventService.createEvent(event));
      // add 1 week each
      m.add(1, 'weeks');
    }
    forkJoin(observables).subscribe(
      () => {
        alert('Neue Eventserie angelegt');
        this.loadAllEvents(this.tenantService.currentTenantValue);
        this.operationOngoing = false;
        this.newEventFormShown = false;
      },
      error => {
        console.error(error);
        alert('Es trat leider ein Fehler auf');
        this.operationOngoing = false;
      }
    );
  }

  isInvalid(formControlName: string): boolean {
    return (
      this.newEventForm.get(formControlName).invalid &&
      this.newEventForm.get(formControlName).touched
    );
  }

  toggleDisabled(event: Event): void {
    event.disabled = !event.disabled;
    // update it on server side, too
    this.eventService.setDisabled(event.id, event.disabled).subscribe();
  }

  deleteEventSeries(uniqueEventSeriesIndex: number): void {
    if (
      confirm(
        'Wollen Sie dieses Serienevent wirklich löschen? Alle Daten aller einzelnen Events gehen unwiderbringlich verloren!'
      )
    ) {
      this.operationOngoing = true;
      const eventToDelete = this.uniqueEvents[uniqueEventSeriesIndex];
      // delete all event instances
      const eventsToDelete = filter(this.allEvents, (event: Event) => {
        return (
          event.name === eventToDelete.name &&
          event.weekDay === eventToDelete.weekDay &&
          event.time === eventToDelete.time
        );
      });
      const observables = [];
      each(eventsToDelete, (event: Event) => {
        observables.push(this.eventService.deleteEvent(event.id));
      });
      forkJoin(observables).subscribe(
        () => {
          alert('Serienevent gelöscht');
          this.loadAllEvents(this.tenantService.currentTenantValue);
          this.operationOngoing = false;
        },
        error => {
          console.error(error);
          alert('Es trat ein Fehler auf, nicht alle Events wurden gelöscht');
          this.operationOngoing = false;
        }
      );
    }
  }

  downloadPdf(event: Event): void {
    this.eventService.downloadPdf(event);
  }

  /**
   * search the events array and find the one event that is a series event of the given unique event
   * @param events
   * @param uniqueEvent
   */
  searchEventByUniqueEvent(events: Event[], uniqueEvent: Event): Event {
    return find(events, {
      name: uniqueEvent.name,
      weekDay: uniqueEvent.weekDay,
      time: uniqueEvent.time,
    });
  }
}
