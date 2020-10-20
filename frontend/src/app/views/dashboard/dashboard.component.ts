import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Week } from 'src/app/models/week';
import { EventService } from 'src/app/services/event.service';
import { Event } from '../../models/event';
import * as moment from 'moment';
import { filter, sortBy, each, find, reject } from 'lodash';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from 'src/app/models/category';
import { CategoryService } from 'src/app/services/category.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Participant } from 'src/app/models/participant';
import { AppService } from 'src/app/services/app.service';
import { ROLE } from '../../../../../common/tenant-relation';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private allEvents: Event[];
  weeks: Week[] = new Array<Week>();
  uniqueEvents: Event[] = null;
  newEventSeriesForm: FormGroup;
  newSingleEventForm: FormGroup;
  operationOngoing: boolean = false;
  newEventSeriesFormShown: boolean = false;
  newSingleEventFormShown: boolean = false;
  eventsOpened: boolean[];
  categories: Category[];
  tenantSubscription: Subscription;
  tenant: Tenant = null;
  modalRef: BsModalRef;
  eventBeingEdited: Event = null;
  editEventForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    date: new FormControl(null),
    weekDay: new FormControl(''),
    time: new FormControl('', Validators.required),
    maxSeats: new FormControl('', Validators.required),
    categoryId: new FormControl(null),
    registrationOpenFrom: new FormControl(null),
  });
  selectedEvent: Event = null;
  participants: Participant[] = null;
  ROLE = ROLE;
  today = new Date();

  constructor(
    private eventService: EventService,
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private modalService: BsModalService,
    public appService: AppService
  ) {}

  ngOnInit() {
    this.createNewEventSeriesForm();
    this.createNewSingleEventForm();
    this.eventsOpened = new Array<boolean>();
    // load the tenant information and redirect in case tenant path does not exist:
    this.tenantSubscription = this.tenantService
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
    this.appService.tenant.subscribe((tenant: Tenant) => {
      if (tenant && tenant != this.tenant) {
        this.tenant = tenant;
        this.appService.setColor(this.tenant);
        this.loadAllEvents(tenant);
      }
    });
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.categoryService
      .getCategories(this.route.snapshot.params.tenantPath)
      .subscribe(categories => {
        this.categories = categories;
        if (this.categories.length > 0) {
          this.categories.sort();
          this.categories.unshift(
            new Category({
              id: null,
              name: '-- ohne Kategorie --',
              tenantId: this.tenant.id,
            })
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.appService.setColor(null);
    if (this.tenantSubscription) {
      this.tenantSubscription.unsubscribe();
    }
  }

  currentCW(): number {
    return moment().isoWeek();
  }

  loadAllEvents(tenant: Tenant): void {
    this.eventService
      .getEvents(tenant.id, null, null, true)
      .subscribe((events: Event[]) => {
        this.weeks = new Array<Week>();
        this.uniqueEvents = new Array<Event>();
        this.allEvents = events;
        this.uniqueEvents = Event.unique(this.allEvents);
        const sortOrder = ['weekDay', 'time', 'name'];
        this.uniqueEvents = sortBy(this.uniqueEvents, sortOrder);
        // prepare the weeks, calculate the past 3 weeks until the end of the year:
        const today = moment();
        const weekNumberThreeWeeksAgo = today
          .clone()
          .subtract(3, 'weeks')
          .week();
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
              categoryId: uniqueEvent.categoryId,
            });
          });
          this.weeks.push(week);
        }
      });
  }

  createNewEventSeriesForm(): void {
    this.newEventSeriesForm = new FormGroup({
      name: new FormControl('', Validators.required),
      categoryId: new FormControl(''),
      fromDate: new FormControl('', Validators.required),
      time: new FormControl('', Validators.required),
      maxSeats: new FormControl('', Validators.required),
    });
  }

  createNewSingleEventForm(): void {
    this.newSingleEventForm = new FormGroup({
      name: new FormControl('', Validators.required),
      categoryId: new FormControl(''),
      date: new FormControl('', Validators.required),
      time: new FormControl('', Validators.required),
      maxSeats: new FormControl('', Validators.required),
      registrationOpenFrom: new FormControl(null),
    });
  }

  addNewEventSeries(): void {
    if (!this.newEventSeriesForm.valid) {
      this.newEventSeriesForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const m = moment(this.newEventSeriesForm.get('fromDate').value);
    const time = <string>this.newEventSeriesForm.get('time').value;
    m.hours(parseInt(time.split(':')[0]));
    m.minutes(parseInt(time.split(':')[1]));
    const currentWeek = m.week();
    // add the event for all following calendar weeks until the end of the year:
    const observables = [];
    for (let cw = currentWeek; cw <= 52; cw++) {
      const event = new Event();
      event.singleOccurence = false;
      event.name = this.newEventSeriesForm.get('name').value;
      event.categoryId = this.newEventSeriesForm.get('categoryId')
        .value as string;
      event.maxSeats = this.newEventSeriesForm.get('maxSeats').value;
      event.date = m.toDate();
      observables.push(this.eventService.createEvent(this.tenant.id, event));
      // add 1 week each
      m.add(1, 'weeks');
    }
    forkJoin(observables).subscribe(
      () => {
        alert('Neue Eventserie angelegt');
        this.loadAllEvents(this.appService.getCurrentTenant());
        this.operationOngoing = false;
        this.newEventSeriesFormShown = false;
      },
      error => {
        console.error(error);
        alert('Es trat leider ein Fehler auf');
        this.operationOngoing = false;
      }
    );
  }

  addNewSingleEvent(): void {
    if (!this.newSingleEventForm.valid) {
      this.newSingleEventForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const m = moment(this.newSingleEventForm.get('date').value);
    const time = <string>this.newSingleEventForm.get('time').value;
    m.hours(parseInt(time.split(':')[0]));
    m.minutes(parseInt(time.split(':')[1]));
    const event = new Event();
    event.singleOccurence = true;
    event.name = this.newSingleEventForm.get('name').value;
    event.categoryId = this.newSingleEventForm.get('categoryId')
      .value as string;
    event.maxSeats = this.newSingleEventForm.get('maxSeats').value;
    event.date = m.toDate();
    const startOfRegistration = moment(
      this.newSingleEventForm.get('registrationOpenFrom').value
    );
    if (startOfRegistration) {
      startOfRegistration.hours(0).minutes(0).seconds(0).milliseconds(0);
      event.registrationOpenFrom = startOfRegistration.toDate();
    }
    this.eventService.createEvent(this.tenant.id, event).subscribe(
      () => {
        alert('Neues Einzelevent angelegt');
        this.loadAllEvents(this.appService.getCurrentTenant());
        this.operationOngoing = false;
        this.newSingleEventFormShown = false;
      },
      error => {
        console.error(error);
        alert('Es trat leider ein Fehler auf');
        this.operationOngoing = false;
      }
    );
  }

  isInvalid(formControl: AbstractControl): boolean {
    return formControl.invalid && formControl.touched;
  }

  toggleDisabled(event: Event): void {
    event.disabled = !event.disabled;
    // update it on server side, too
    this.eventService.setDisabled(event.id, event.disabled).subscribe();
  }

  deleteEventSeries(uniqueEventSeriesIndex: number): void {
    const eventToDelete = this.uniqueEvents[uniqueEventSeriesIndex];
    if (
      confirm(
        eventToDelete.singleOccurence
          ? 'Wollen Sie wirklich dieses Event löschen? Alle Daten gehen unwiderbringlich verloren'
          : 'Wollen Sie alle Events in dieser Spalte wirklich löschen? Alle Daten aller einzelnen Events gehen unwiderbringlich verloren!'
      )
    ) {
      this.operationOngoing = true;
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
        observables.push(
          this.eventService.deleteEvent(this.tenant.id, event.id)
        );
      });
      forkJoin(observables).subscribe(
        () => {
          if (eventToDelete.singleOccurence) {
            alert('Event gelöscht');
          } else {
            alert('Eventserie gelöscht');
          }
          this.loadAllEvents(this.appService.getCurrentTenant());
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

  categoryName(categoryId: string): string {
    if (this.categoryById(categoryId)) {
      return this.categoryById(categoryId).name;
    }
    return null;
  }

  categoryById(categoryId: string): Category {
    return find(this.categories, { id: categoryId });
  }

  editSeriesEvent(uniqueEvent: Event, template: TemplateRef<any>) {
    this.newEventSeriesFormShown = false;
    this.newSingleEventFormShown = false;
    this.modalRef = this.modalService.show(template);
    this.eventBeingEdited = uniqueEvent;
    this.editEventForm.get('name').setValue(this.eventBeingEdited.name);
    this.editEventForm.get('weekDay').setValue(this.eventBeingEdited.weekDay);
    this.editEventForm
      .get('date')
      .setValue(moment(this.eventBeingEdited.date).format('yyyy-MM-DD'));
    this.editEventForm
      .get('time')
      .setValue(moment(this.eventBeingEdited.date).format('HH:mm'));
    const optionalCategory = find(this.categories, {
      id: this.eventBeingEdited.categoryId,
    });
    if (optionalCategory) {
      this.editEventForm.get('categoryId').setValue(optionalCategory.id);
    }
    this.editEventForm.get('maxSeats').setValue(this.eventBeingEdited.maxSeats);
    if (this.eventBeingEdited.singleOccurence) {
      this.editEventForm
        .get('registrationOpenFrom')
        .setValue(
          moment(this.eventBeingEdited.registrationOpenFrom).format(
            'yyyy-MM-DD'
          )
        );
      this.editEventForm.get('date').setValidators(Validators.required);
      this.editEventForm.get('weekDay').setValidators(null);
    } else {
      this.editEventForm.get('weekDay').setValidators(Validators.required);
      this.editEventForm.get('date').setValidators(null);
    }
  }

  updateEvents(): void {
    if (this.editEventForm.invalid) {
      alert('Bitte erst alle Felder korrekt ausfüllen');
      return;
    }
    // first of all determine all events that are in the future for the instance being edited
    let eventsToUpdate;
    if (this.eventBeingEdited.singleOccurence) {
      eventsToUpdate = new Array<Event>();
      eventsToUpdate.push(this.eventBeingEdited);
    } else {
      eventsToUpdate = filter(this.allEvents, (event: Event) => {
        return (
          event.name === this.eventBeingEdited.name &&
          event.weekDay === this.eventBeingEdited.weekDay &&
          event.categoryId === this.eventBeingEdited.categoryId &&
          event.time === this.eventBeingEdited.time &&
          moment(event.date).isAfter(moment())
        );
      });
    }

    // now edit and update each of those events:
    const observables = new Array<Observable<Event>>();
    each(eventsToUpdate, (event: Event) => {
      event.name = this.editEventForm.get('name').value;
      event.maxSeats = this.editEventForm.get('maxSeats').value;
      event.categoryId = this.editEventForm.get('categoryId').value as string;
      // the date is being constructed out of weekday and time
      const time = <string>this.editEventForm.get('time').value;
      if (event.singleOccurence) {
        event.date = moment(this.editEventForm.get('date').value)
          .hours(parseInt(time.split(':')[0]))
          .minutes(parseInt(time.split(':')[1]))
          .toDate();
        const startOfRegistration = moment(
          this.editEventForm.get('registrationOpenFrom').value
        );
        if (startOfRegistration) {
          startOfRegistration.hours(0).minutes(0).seconds(0).milliseconds(0);
          event.registrationOpenFrom = startOfRegistration.toDate();
        }
      } else {
        event.date = moment(event.date)
          .isoWeekday(this.editEventForm.get('weekDay').value)
          .hours(parseInt(time.split(':')[0]))
          .minutes(parseInt(time.split(':')[1]))
          .toDate();
      }
      observables.push(this.eventService.updateEvent(event));
    });
    forkJoin(observables).subscribe(() => {
      if (this.eventBeingEdited.singleOccurence) {
        alert('Eventdaten aktualisiert');
      } else {
        alert('Alle künftigen Events aktualisiert');
      }
      this.modalRef.hide();
      location.reload();
    });
  }

  eventNotinPast(): boolean {
    return !this.selectedEvent.isInPast();
  }

  showEventParticipants(event: Event, template: TemplateRef<any>): void {
    this.selectedEvent = event;
    this.participants = null;
    this.eventService
      .getParticipants(this.tenant.id, event.id)
      .subscribe(participants => {
        this.participants = participants;
      });
    this.modalRef = this.modalService.show(template, { class: 'modal-xl' });
  }

  deleteParticipant(participant: Participant): void {
    this.eventService
      .deleteParticipant(this.tenant.id, this.selectedEvent.id, participant.id)
      .subscribe(() => {
        alert('Teilnehmer von Aktivität entfernt');
        this.participants = reject(this.participants, { id: participant.id });
        this.selectedEvent.takenSeats -= 1;
      });
  }
}
