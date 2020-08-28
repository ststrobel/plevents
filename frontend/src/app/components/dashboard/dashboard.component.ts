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
  timeColumns: string[] = new Array<string>();
  newEventForm: FormGroup;

  constructor(
    private eventService: EventService,
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  eventAt(time: string, events: Event[]): Event {
    const match = find(events, (event: Event) => {
      return event.displayTime() === time;
    });
    return match;
  }

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
    this.weeks = new Array<Week>();
    this.uniqueEvents = new Array<Event>();
    this.timeColumns = new Array<string>();
    this.eventService.getEvents(tenant.id).subscribe((events: Event[]) => {
      this.allEvents = events;
      this.uniqueEvents = Event.unique(this.allEvents);
      this.uniqueEvents = sortBy(this.uniqueEvents, ['weekDay', 'time']);
      each(this.uniqueEvents, (event: Event) => {
        this.timeColumns.push(event.displayTime());
      });
      // prepare the weeks, calculate the past 3 weeks until the end of the year:
      const today = moment();
      const startOfCurrentWeek = today.clone().startOf('week');
      const endOfCurrentWeek = today.clone().endOf('week');
      for (let kw = today.week() - 3; kw <= 52; kw++) {
        const week = new Week(kw);
        let weekStart: any, weekEnd: any;
        if (kw < today.week()) {
          weekStart = startOfCurrentWeek
            .clone()
            .subtract(today.week() - kw, 'weeks');
          weekEnd = endOfCurrentWeek
            .clone()
            .subtract(today.week() - kw, 'weeks');
        } else {
          weekStart = startOfCurrentWeek
            .clone()
            .add(kw - today.week(), 'weeks');
          weekEnd = endOfCurrentWeek.clone().add(kw - today.week(), 'weeks');
        }
        // add all events for this week
        week.events = filter(events, (event: Event) => {
          return moment(event.date).isBetween(
            weekStart,
            weekEnd,
            undefined,
            '[]'
          );
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
    forkJoin(observables).subscribe(() => {
      this.loadAllEvents(this.tenantService.currentTenantValue);
    });
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
      forkJoin(observables).subscribe(() => {
        this.loadAllEvents(this.tenantService.currentTenantValue);
      });
    }
  }

  downloadPdf(event: Event): void {
    this.eventService.downloadPdf(event);
  }
}
