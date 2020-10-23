import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventService } from 'src/app/services/event.service';
import { Week } from 'src/app/models/week';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { sortBy, each, filter, find, map, max, uniq } from 'lodash';
import * as moment from 'moment';
import { Event } from 'src/app/models/event';
import { Participant } from 'src/app/models/participant';
import { TenantService } from 'src/app/services/tenant.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Tenant } from 'src/app/models/tenant';
import { HttpErrorResponse } from '@angular/common/http';
import { Category } from 'src/app/models/category';
import { CategoryService } from 'src/app/services/category.service';
import { forkJoin, Subscription } from 'rxjs';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit, OnDestroy {
  weeks: Week[] = null;
  uniqueEvents: Event[] = null;
  eventsInTimeframe: Event[] = new Array<Event>();
  timeColumns: string[] = new Array<string>();
  registerForm: FormGroup;
  selectedEvent: Event = null;
  successfullyRegistered = false;
  categoryOptions: string[] = null;
  categories: Category[];
  selectedCategory: Category = undefined;
  consentTeaser1: string = null;
  consentTeaser2: string = null;
  consentText1: string = null;
  consentText2: string = null;
  consentText1Shown: boolean = false;
  consentText2Shown: boolean = false;
  tenantSubscription: Subscription;
  tenant: Tenant = null;

  constructor(
    private eventService: EventService,
    private tenantService: TenantService,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private appService: AppService
  ) {}

  ngOnInit() {
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
    this.createRegisterForm();
    this.tenantService.load(this.route.snapshot.params.tenantPath);
    this.tenantSubscription = this.appService.tenant.subscribe(
      (tenant: Tenant) => {
        if (tenant) {
          this.tenant = tenant;
          this.appService.setColor(this.tenant);
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
      }
    );
  }

  ngOnDestroy(): void {
    this.appService.setColor(null);
    if (this.tenantSubscription) {
      this.tenantSubscription.unsubscribe();
    }
  }

  loadEvents(): void {
    this.timeColumns = new Array<string>();
    const today = moment();
    const start = today.clone(); //.startOf('week').add(1, 'week');
    const end = today.clone().endOf('week').add(1, 'week');
    const observables = [];
    observables.push(
      this.eventService.getEvents(
        this.appService.getCurrentTenant().id,
        start,
        end
      )
    );
    observables.push(this.categoryService.getCategories(this.tenant.path));
    forkJoin(observables).subscribe(results => {
      /////////////////////////////////////////
      const events = results[0] as Event[];
      // filter out all events that are disabled
      this.eventsInTimeframe = filter(events, { disabled: false });
      /////////////////////////////////////////
      this.categories = results[1] as Category[];
      // only consider categories that have at least one event present
      this.categories = filter(this.categories, (category: Category) => {
        return (
          filter(
            this.eventsInTimeframe,
            event => event.categoryId === category.id
          ).length > 0
        );
      });
      this.categoryOptions = new Array<string>();
      this.categoryOptions.push(...filter(map(this.categories, 'name')));
      // sort the values
      this.categoryOptions = this.categoryOptions.sort();
      // add 'alle' at the top
      this.categoryOptions.unshift('alle');
    });
  }

  selectCategory(category: Category): void {
    this.selectedCategory = category;
    this.selectedEvent = null;
    this.registerForm.markAsUntouched();
    this.determineUniqueEvents();
    const eventsToDisplay = <Event[]>(
      filter(this.eventsInTimeframe, (event: Event) => {
        if (this.selectedCategory === null) {
          return true;
        }
        return event.categoryId === this.selectedCategory.id;
      })
    );
    this.weeks = this.generateWeeksNeededToDisplayEvents(eventsToDisplay);
    each(eventsToDisplay, (event: Event) => {
      // find out at which position to display the event
      each(this.uniqueEvents, (uniqueEvent: Event, index: number) => {
        if (
          uniqueEvent.displayName() === event.displayName() &&
          uniqueEvent.weekDay === event.weekDay &&
          uniqueEvent.displayTime() === event.displayTime()
        ) {
          // find the calendar week to put it in to
          const week = find(this.weeks, {
            number: moment(event.date).isoWeek(),
          });
          week.events[index] = event;
        }
      });
    });
  }

  generateWeeksNeededToDisplayEvents(events: Event[]): Week[] {
    const weeks = new Array<Week>();
    let maxDate = new Date();
    each(events, event => {
      if (event.date > maxDate) {
        maxDate = event.date;
      }
    });
    for (
      let isoWeek = moment().isoWeek();
      isoWeek <= moment(maxDate).isoWeek() || isoWeek <= moment().isoWeek() + 1;
      isoWeek++
    ) {
      const week = new Week(isoWeek);
      week.startOfWeek = moment().isoWeek(isoWeek).startOf('week');
      week.endOfWeek = moment().isoWeek(isoWeek).endOf('week');
      week.events = new Array<Event>(this.uniqueEvents.length);
      weeks.push(week);
    }
    return weeks;
  }

  private determineUniqueEvents(): void {
    this.uniqueEvents = new Array<Event>();
    each(this.eventsInTimeframe, (event: Event) => {
      if (
        !this.selectedCategory ||
        event.categoryId === this.selectedCategory.id
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
      firstname: new FormControl('', Validators.required),
      lastname: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', Validators.required),
      street: new FormControl('', Validators.required),
      zip: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      rememberMe: new FormControl(false),
      dataprivacy: new FormControl(false, Validators.required),
    });
    // check if stored personal information exists. if so, prefill the form:
    const previousData = JSON.parse(localStorage.getItem('rememberMe'));
    if (previousData) {
      this.registerForm.get('firstname').setValue(previousData.firstname);
      this.registerForm.get('lastname').setValue(previousData.lastname);
      this.registerForm.get('email').setValue(previousData.email);
      this.registerForm.get('phone').setValue(previousData.phone);
      this.registerForm.get('street').setValue(previousData.street);
      this.registerForm.get('zip').setValue(previousData.zip);
      this.registerForm.get('city').setValue(previousData.city);
      this.registerForm.get('rememberMe').setValue(true);
    }
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
      // scroll down to the participant form
      setTimeout(() => {
        document.getElementsByTagName('h5')[0].scrollIntoView();
      }, 20);
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
    participant.firstname = this.registerForm.get('firstname').value;
    participant.lastname = this.registerForm.get('lastname').value;
    participant.email = this.registerForm.get('email').value;
    participant.phone = this.registerForm.get('phone').value;
    participant.street = this.registerForm.get('street').value;
    participant.zip = this.registerForm.get('zip').value;
    participant.city = this.registerForm.get('city').value;
    // if the user has selected the rememberMe flag, store the data locally so that it can be used next time to pre-fill the data
    if (this.registerForm.get('rememberMe').value === true) {
      localStorage.setItem('rememberMe', JSON.stringify(participant));
    } else {
      // in case pre-entered information exists, but the user does not want it to be stored any more, remove it from local storage
      localStorage.removeItem('rememberMe');
    }
    participant.name = participant.firstname + ' ' + participant.lastname;
    participant.eventId = this.selectedEvent.id;
    this.eventService.addParticipant(participant).subscribe(() => {
      this.successfullyRegistered = true;
      this.registerForm.reset();
    });
  }

  singleEvents(uniqueEvents: Event[]): Event[] {
    return filter(uniqueEvents, { singleOccurence: true });
  }

  recurringEvents(uniqueEvents: Event[]): Event[] {
    return filter(uniqueEvents, { singleOccurence: false });
  }
}
