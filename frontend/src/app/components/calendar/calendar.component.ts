import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { each, filter, sortBy } from 'lodash';
import * as moment from 'moment';
import { Event } from '../../models/event';
import { Week } from 'src/app/models/week';
import { AppService } from 'src/app/services/app.service';
import { Tenant } from 'src/app/models/tenant';
import { ROLE } from '../../../../../common/tenant-relation';

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @Input()
  events: Event[];
  @Input()
  tenant: Tenant;

  @Output()
  eventClicked = new EventEmitter();
  @Output()
  statusToggled = new EventEmitter();

  weeks: Week[];
  months: number[];
  ROLE = ROLE;

  constructor(public appService: AppService) {}

  ngOnInit(): void {
    // calculate the months to come this year (including the previous one)
    this.months = new Array<number>();
    for (
      let m = moment().month() - 1 >= 0 ? moment().month() - 1 : 0;
      m < 12;
      m++
    ) {
      this.months.push(m);
    }
    // put the events in the corresponding weeks
    this.putEventsInWeeks();
  }

  weeksInMonth(month: number): Week[] {
    return filter(this.weeks, week => {
      return (
        week.startOfWeek.month() === month || week.endOfWeek.month() === month
      );
    });
  }

  displayMonth(month: number): string {
    return moment().month(month).format('MMMM');
  }

  currentCW(): number {
    return moment().isoWeek();
  }

  clickOn(event: Event): void {
    this.eventClicked.emit(event);
  }

  toggleDisabled(clickEvent: any, event: Event): void {
    clickEvent.stopPropagation();
    this.statusToggled.emit(event);
  }

  /**
   * returns the day within year
   * @param week
   * @param month
   */
  daysInWeek(week: Week, month: number): number[] {
    const days = new Array<number>(7);
    for (
      let day = week.startOfWeek.dayOfYear();
      day < week.startOfWeek.dayOfYear() + 7;
      day++
    ) {
      if (moment().dayOfYear(day).month() === month) {
        days[moment().dayOfYear(day).weekday()] = day;
      }
    }
    return days;
  }

  dayOfMonth(dayOfYear: number): string {
    if (dayOfYear) {
      return moment().dayOfYear(dayOfYear).format('D');
    }
    return null;
  }

  eventsOnDay(day: number, week: Week): Event[] {
    return filter(week.events, event => {
      return moment(event.date).dayOfYear() === day;
    });
  }

  putEventsInWeeks(): void {
    this.weeks = new Array<Week>();
    const sortOrder = ['weekDay', 'time', 'name'];
    this.events = sortBy(this.events, sortOrder);
    // prepare the weeks, calculate the past 4 weeks until the end of the year:
    const today = moment();
    const weekNumberFourWeeksAgo = today.clone().subtract(4, 'weeks').week();
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
      kw <= moment().date(31).month(12).isoWeek();
      kw++
    ) {
      const week = new Week(kw);
      week.startOfWeek = startOfWeekFourWeeksAgo
        .clone()
        .add(kw - weekNumberFourWeeksAgo, 'weeks');
      week.endOfWeek = endOfWeekFourWeeksAgo
        .clone()
        .add(kw - weekNumberFourWeeksAgo, 'weeks');
      // add all events for this week
      week.events = filter(this.events, (event: Event) => {
        return moment(event.date).isBetween(
          week.startOfWeek,
          week.endOfWeek,
          undefined,
          '[]'
        );
      });
      this.weeks.push(week);
    }
  }
}
