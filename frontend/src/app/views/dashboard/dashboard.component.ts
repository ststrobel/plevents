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
import { Subscription } from 'rxjs';
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
    maxSeats: new FormControl('', [Validators.required, Validators.min(1)]),
    categoryId: new FormControl(null),
    registrationOpenFrom: new FormControl(null),
  });
  selectedEvent: Event = null;
  participants: Participant[] = null;
  ROLE = ROLE;
  today = new Date();
  addParticipantForm: FormGroup = new FormGroup({
    firstname: new FormControl('', Validators.required),
    lastname: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', Validators.required),
    street: new FormControl('', Validators.required),
    zip: new FormControl('', Validators.required),
    city: new FormControl('', Validators.required),
  });
  showAddParticipantForm: boolean = false;
  addParticipantSuccess: string = null;

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
    this.uniqueEvents = null;
    this.eventService
      .getEvents(tenant.id, null, null, true)
      .subscribe((events: Event[]) => {
        this.weeks = new Array<Week>();
        this.uniqueEvents = new Array<Event>();
        this.allEvents = events;
        this.uniqueEvents = Event.unique(this.allEvents);
        const sortOrder = ['weekDay', 'time', 'name'];
        this.uniqueEvents = sortBy(this.uniqueEvents, sortOrder);
        // prepare the weeks, calculate the past 4 weeks until the end of the year:
        const today = moment();
        const weekNumberFourWeeksAgo = today
          .clone()
          .subtract(4, 'weeks')
          .week();
        const startOfWeekFourWeeksAgo = today
          .clone()
          .startOf('week')
          .subtract(4, 'weeks');
        const endOfWeekFourWeeksAgo = today
          .clone()
          .endOf('week')
          .subtract(4, 'weeks');
        for (
          let kw = today.week() - 4;
          kw <= moment().date(31).month(11).isoWeek();
          kw++
        ) {
          const week = new Week(kw);
          const weekStart = startOfWeekFourWeeksAgo
            .clone()
            .add(kw - weekNumberFourWeeksAgo, 'weeks');
          const weekEnd = endOfWeekFourWeeksAgo
            .clone()
            .add(kw - weekNumberFourWeeksAgo, 'weeks');
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
      categoryId: new FormControl(null),
      fromDate: new FormControl('', Validators.required),
      time: new FormControl('', Validators.required),
      maxSeats: new FormControl('', [Validators.required, Validators.min(1)]),
    });
  }

  createNewSingleEventForm(): void {
    this.newSingleEventForm = new FormGroup({
      name: new FormControl('', Validators.required),
      categoryId: new FormControl(null),
      date: new FormControl('', Validators.required),
      time: new FormControl('', Validators.required),
      maxSeats: new FormControl('', [Validators.required, Validators.min(1)]),
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
    const event = new Event();
    event.singleOccurence = false;
    event.name = this.newEventSeriesForm.get('name').value;
    event.categoryId = this.newEventSeriesForm.get('categoryId')
      .value as string;
    event.maxSeats = this.newEventSeriesForm.get('maxSeats').value;
    event.date = m.toDate();
    this.eventService.createEvent(this.tenant.id, event).subscribe(
      () => {
        alert('Neue Eventserie angelegt');
        this.loadAllEvents(this.appService.getCurrentTenant());
        this.operationOngoing = false;
        this.newEventSeriesFormShown = false;
        this.newEventSeriesForm.reset();
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
        this.newSingleEventForm.reset();
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
    this.eventService
      .setDisabled(this.tenant.id, event.id, event.disabled)
      .subscribe();
  }

  deleteEventSeries(uniqueEventSeriesIndex: number): void {
    const eventToDelete = this.uniqueEvents[uniqueEventSeriesIndex];
    if (eventToDelete.singleOccurence) {
      if (
        confirm(
          'Wollen Sie wirklich dieses Event löschen? Alle Daten gehen unwiderbringlich verloren'
        )
      ) {
        this.operationOngoing = true;
        this.eventService
          .deleteEvent(this.tenant.id, eventToDelete.id)
          .subscribe(
            () => {
              alert('Event gelöscht');
              this.loadAllEvents(this.appService.getCurrentTenant());
              this.operationOngoing = false;
            },
            error => {
              console.error(error);
              alert('Es trat ein Fehler auf, Event wurde nicht gelöscht');
              this.operationOngoing = false;
            }
          );
      }
    } else {
      if (
        confirm(
          'Wollen Sie alle KÜNFTIGEN Events in dieser Spalte wirklich löschen? Alle Daten dieser Events gehen unwiderbringlich verloren!'
        )
      ) {
        this.operationOngoing = true;
        this.eventService
          .deleteEventSeries(this.tenant.id, eventToDelete.eventSeries.id)
          .subscribe(
            () => {
              alert('zukünftige Serienevents gelöscht');
              this.loadAllEvents(this.appService.getCurrentTenant());
              this.operationOngoing = false;
            },
            error => {
              console.error(error);
              alert(
                'Es trat ein Fehler auf, nicht alle Events wurden gelöscht'
              );
              this.operationOngoing = false;
            }
          );
      }
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
    this.eventBeingEdited = this.lastEventOfSeries(uniqueEvent);
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
    const updatedEventData: any = {
      name: this.editEventForm.get('name').value,
      maxSeats: this.editEventForm.get('maxSeats').value,
      categoryId: this.editEventForm.get('categoryId').value as string,
      tenantId: this.tenant.id,
    };
    // the date is being constructed out of weekday and time
    const time = <string>this.editEventForm.get('time').value;
    if (this.eventBeingEdited.singleOccurence) {
      // the date is being constructed out of weekday and time
      updatedEventData.date = moment(this.editEventForm.get('date').value)
        .hours(parseInt(time.split(':')[0]))
        .minutes(parseInt(time.split(':')[1]))
        .toDate();
      const startOfRegistration = moment(
        this.editEventForm.get('registrationOpenFrom').value
      );
      if (startOfRegistration) {
        startOfRegistration.hours(0).minutes(0).seconds(0).milliseconds(0);
        updatedEventData.registrationOpenFrom = startOfRegistration.toDate();
      }
      updatedEventData.id = this.eventBeingEdited.id;
      this.eventService.updateEvent(updatedEventData).subscribe(
        () => {
          alert('Eventdaten aktualisiert');
          this.modalRef.hide();
          this.loadAllEvents(this.appService.getCurrentTenant());
        },
        error => {
          console.error(error);
          alert('Es ist ein Fehler aufgetreten');
        }
      );
    } else {
      // the date is being constructed out of weekday and time
      updatedEventData.date = moment(this.eventBeingEdited.date)
        .isoWeekday(this.editEventForm.get('weekDay').value)
        .hours(parseInt(time.split(':')[0]))
        .minutes(parseInt(time.split(':')[1]))
        .toDate();
      updatedEventData.eventSeries = this.eventBeingEdited.eventSeries;
      this.eventService.updateEventSeries(updatedEventData).subscribe(
        () => {
          alert('Alle künftigen Events aktualisiert');
          this.modalRef.hide();
          this.loadAllEvents(this.appService.getCurrentTenant());
        },
        error => {
          console.error(error);
          alert('Es ist ein Fehler aufgetreten');
        }
      );
    }
  }

  eventNotinPast(): boolean {
    return !this.selectedEvent.isInPast();
  }

  showEventParticipants(event: Event, template: TemplateRef<any>): void {
    this.selectedEvent = event;
    this.participants = null;
    this.showAddParticipantForm = false;
    this.addParticipantSuccess = null;
    this.addParticipantForm.reset();
    this.eventService
      .getParticipants(this.tenant.id, event.id)
      .subscribe(participants => {
        this.participants = participants;
      });
    this.modalRef = this.modalService.show(template, { class: 'modal-xl' });
  }

  deleteParticipant(participant: Participant): void {
    if (
      confirm('Möchten Sie diesen Teilnehmer wirklich von der Liste entfernen?')
    ) {
      this.eventService
        .deleteParticipant(
          this.tenant.id,
          this.selectedEvent.id,
          participant.id
        )
        .subscribe(() => {
          alert('Teilnehmer von Aktivität entfernt');
          this.participants = reject(this.participants, { id: participant.id });
          this.selectedEvent.takenSeats -= 1;
        });
    }
  }

  addParticipant(): void {
    if (this.addParticipantForm.invalid) {
      this.addParticipantForm.markAllAsTouched();
      return;
    }
    const participant = new Participant();
    participant.firstname = this.addParticipantForm.get('firstname').value;
    participant.lastname = this.addParticipantForm.get('lastname').value;
    participant.email = this.addParticipantForm.get('email').value;
    participant.phone = this.addParticipantForm.get('phone').value;
    participant.street = this.addParticipantForm.get('street').value;
    participant.zip = this.addParticipantForm.get('zip').value;
    participant.city = this.addParticipantForm.get('city').value;
    participant.eventId = this.selectedEvent.id;
    this.eventService
      .addParticipant(participant)
      .subscribe((createdParticipant: Participant) => {
        this.addParticipantForm.reset();
        this.addParticipantSuccess =
          'Teilnehmer ' +
          participant.firstname +
          ' ' +
          participant.lastname +
          ' zur Veranstaltung hinzugefügt';
        this.participants.push(createdParticipant);
      });
  }

  /**
   * this function will traverse all events and return the last event of its respective series. if it is a single event, the event itself is being returned
   * @param uniqueEvent
   */
  lastEventOfSeries(uniqueEvent: Event): Event {
    if (uniqueEvent.singleOccurence) {
      return uniqueEvent;
    }
    const eventsInRow = filter(this.allEvents, (event: Event) => {
      return (
        uniqueEvent.name === event.name &&
        uniqueEvent.weekDay === event.weekDay &&
        uniqueEvent.categoryId === event.categoryId &&
        uniqueEvent.time === event.time
      );
    });
    // now determine the last happening
    let lastEvent = eventsInRow[0];
    each(eventsInRow, event => {
      if (moment(event.date).isAfter(moment(lastEvent.date))) {
        lastEvent = event;
      }
    });
    return lastEvent;
  }
}
