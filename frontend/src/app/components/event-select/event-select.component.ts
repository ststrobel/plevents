import { Component, Input, OnInit } from '@angular/core';
import { Event } from 'src/app/models/event';

@Component({
  selector: 'app-event-select',
  templateUrl: './event-select.component.html',
  styleUrls: ['./event-select.component.scss'],
})
export class EventSelectComponent implements OnInit {
  @Input()
  event: Event;
  @Input()
  selected: boolean = false;

  constructor() {}

  ngOnInit(): void {}

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
}
