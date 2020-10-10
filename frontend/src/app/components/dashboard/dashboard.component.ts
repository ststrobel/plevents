import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Week } from 'src/app/models/week';
import { EventService } from 'src/app/services/event.service';
import { Event } from '../../models/event';
import * as moment from 'moment';
import { filter, sortBy, each, find, map, reject } from 'lodash';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { forkJoin, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from 'src/app/models/category';
import { CategoryService } from 'src/app/services/category.service';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {
  filter as rxjsFilter,
  debounceTime,
  distinctUntilChanged,
  map as rxjsMap,
} from 'rxjs/operators';
import { Participant } from 'src/app/models/participant';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private allEvents: Event[];
  weeks: Week[] = new Array<Week>();
  uniqueEvents: Event[] = null;
  newEventForm: FormGroup;
  operationOngoing: boolean = false;
  newEventFormShown: boolean = false;
  eventsOpened: boolean[];
  categories: Category[];
  @ViewChild('instance', { static: true }) instance: NgbTypeahead;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  tenantSubscription: Subscription;
  tenant: Tenant = null;
  modalRef: BsModalRef;
  eventBeingEdited: Event = null;
  editEventForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    weekDay: new FormControl('', Validators.required),
    time: new FormControl('', Validators.required),
    maxSeats: new FormControl('', Validators.required),
    category: new FormControl('', Validators.required),
  });
  selectedEvent: Event = null;
  participants: Participant[] = null;

  constructor(
    private eventService: EventService,
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private modalService: BsModalService
  ) {}

  ngOnInit() {
    this.createNewEventForm();
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
    this.tenantService.currentTenant.subscribe((tenant: Tenant) => {
      if (tenant && tenant != this.tenant) {
        this.tenant = tenant;
        this.loadAllEvents(tenant);
      }
    });
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.categoryService
      .getCategorys(this.route.snapshot.params.tenantPath)
      .subscribe(categories => {
        this.categories = categories;
      });
    this.createNewEventForm();
  }

  ngOnDestroy(): void {
    if (this.tenantSubscription) {
      this.tenantSubscription.unsubscribe();
    }
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
      const sortOrder = ['weekDay', 'time', 'name'];
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
            categoryId: uniqueEvent.categoryId,
          });
        });
        this.weeks.push(week);
      }
    });
  }

  createNewEventForm(): void {
    this.newEventForm = new FormGroup({
      name: new FormControl('', Validators.required),
      category: new FormControl(''),
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
    // first - check if the category is new or existed previously:
    const category = this.newEventForm.get('category').value;
    let existingCategory = find(
      this.categories,
      (existingCategory: Category) =>
        existingCategory.name.toLowerCase() === category
    );
    let categoryObservable: Observable<Category>;
    if (existingCategory) {
      // the user selected a category that existed previously
      categoryObservable = of(existingCategory);
    } else {
      categoryObservable = this.categoryService.createCategory({
        name: category,
        tenantId: this.tenantService.currentTenantValue.id,
      });
    }
    // continue only when a category is available
    categoryObservable.subscribe(category => {
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
        event.categoryId = category.id;
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
    });
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

  categoryName(categoryId: string): string {
    const category = find(this.categories, { id: categoryId });
    if (category) {
      return category.name;
    }
    return null;
  }

  /**
   * auto typeahead function from ng bootstrap: https://ng-bootstrap.github.io/#/components/typeahead/examples
   * @param text$
   */
  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(
      debounceTime(200),
      distinctUntilChanged()
    );
    const clicksWithClosedPopup$ = this.click$.pipe(
      rxjsFilter(() => !this.instance.isPopupOpen())
    );
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      rxjsMap(term =>
        term === ''
          ? map(this.categories, 'name')
          : map(
              this.categories.filter(
                c => c.name.toLowerCase().indexOf(term.toLowerCase()) > -1
              ),
              'name'
            ).slice(0, 10)
      )
    );
  };

  editSeriesEvent(uniqueEvent: Event, template: TemplateRef<any>) {
    this.newEventFormShown = false;
    this.modalRef = this.modalService.show(template);
    this.eventBeingEdited = uniqueEvent;
    this.editEventForm.get('name').setValue(uniqueEvent.name);
    this.editEventForm.get('weekDay').setValue(uniqueEvent.weekDay);
    this.editEventForm.get('time').setValue(uniqueEvent.displayTime(false));
    this.editEventForm
      .get('category')
      .setValue(find(this.categories, { id: uniqueEvent.categoryId }).name);
    this.editEventForm.get('maxSeats').setValue(uniqueEvent.maxSeats);
  }

  updateEvents(): void {
    if (this.editEventForm.invalid) {
      alert('Bitte erst alle Felder korrekt ausfüllen');
      return;
    }
    // first of all determine all events that are in the future for the instance being edited
    const eventsToUpdate = filter(this.allEvents, (event: Event) => {
      return (
        event.name === this.eventBeingEdited.name &&
        event.weekDay === this.eventBeingEdited.weekDay &&
        event.categoryId === this.eventBeingEdited.categoryId &&
        event.time === this.eventBeingEdited.time &&
        moment(event.date).isAfter(moment())
      );
    });
    // first - check if the category is new or existed previously:
    const category = this.editEventForm.get('category').value;
    let existingCategory = find(
      this.categories,
      (existingCategory: Category) =>
        existingCategory.name.toLowerCase() === category
    );
    let categoryObservable: Observable<Category>;
    if (existingCategory) {
      // the user selected a category that existed previously
      categoryObservable = of(existingCategory);
    } else {
      categoryObservable = this.categoryService.createCategory({
        name: category,
        tenantId: this.tenantService.currentTenantValue.id,
      });
    }
    // continue only when a category is available
    categoryObservable.subscribe(category => {
      // now edit and update each of those events:
      const observables = new Array<Observable<Event>>();
      each(eventsToUpdate, (event: Event) => {
        event.name = this.editEventForm.get('name').value;
        event.maxSeats = this.editEventForm.get('maxSeats').value;
        event.categoryId = category.id;
        // the date is being constructed out of weekday and time
        const time = <string>this.editEventForm.get('time').value;
        event.date = moment(event.date)
          .isoWeekday(this.editEventForm.get('weekDay').value)
          .hours(parseInt(time.split(':')[0]))
          .minutes(parseInt(time.split(':')[1]))
          .toDate();
        observables.push(this.eventService.updateEvent(event));
      });
      forkJoin(observables).subscribe(() => {
        alert('Alle künftigen Events aktualisiert');
        this.modalRef.hide();
        location.reload();
      });
    });
  }

  eventNotinPast(): boolean {
    return !this.selectedEvent.isInPast();
  }

  showEventParticipants(event: Event, template: TemplateRef<any>): void {
    this.selectedEvent = event;
    this.participants = null;
    this.eventService.getParticipants(event.id).subscribe(participants => {
      this.participants = participants;
    });
    this.modalRef = this.modalService.show(template, { class: 'modal-xl' });
  }

  deleteParticipant(participant: Participant): void {
    this.eventService
      .deleteParticipant(this.selectedEvent.id, participant.id)
      .subscribe(() => {
        alert('Teilnehmer von Aktivität entfernt');
        this.participants = reject(this.participants, { id: participant.id });
        this.selectedEvent.takenSeats -= 1;
      });
  }
}
