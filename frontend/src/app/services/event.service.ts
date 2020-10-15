import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Event, EventAdapter } from '../models/event';
import { EventI } from '../../../../common/event';
import { ParticipantI } from '../../../../common/participant';
import { Participant, ParticipantAdapter } from '../models/participant';
import { saveAs } from 'file-saver';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(
    private http: HttpClient,
    private eventAdapter: EventAdapter,
    private participantAdapter: ParticipantAdapter
  ) {}

  /**
   * get all events for a specific tenant
   * @param tenantId
   * @param start the start date/time of the timeframe
   * @param end the end date/time of the timeframe
   */
  getEvents(
    tenantId: string,
    start?: moment.Moment,
    end?: moment.Moment,
    privateEvents?: boolean
  ): Observable<Event[]> {
    const params: any = {};
    if (start) {
      params.start = start.format('yyyy-MM-DD');
    }
    if (end) {
      params.end = end.format('yyyy-MM-DD');
    }
    return this.http
      .get(
        `${environment.apiUrl}${
          privateEvents ? '/secure' : ''
        }/tenants/${tenantId}/events`,
        { params }
      )
      .pipe(
        // Adapt the raw items
        map((data: any[]) => data.map(item => this.eventAdapter.adapt(item)))
      );
  }

  createEvent(tenantId: string, event: EventI): Observable<Event> {
    return this.http
      .post(`${environment.apiUrl}/secure/tenants/${tenantId}/events`, event)
      .pipe(
        // Adapt the raw items
        map(data => this.eventAdapter.adapt(data))
      );
  }

  updateEvent(event: Event): Observable<Event> {
    return this.http
      .put(
        `${environment.apiUrl}/secure/tenants/${event.tenantId}/events/${event.id}`,
        event
      )
      .pipe(
        // Adapt the raw items
        map(data => this.eventAdapter.adapt(data))
      );
  }

  deleteEvent(tenantId: string, eventId: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/secure/tenants/${tenantId}/events/${eventId}`
    );
  }

  setDisabled(id: string, disabled: boolean): Observable<Event> {
    return this.http
      .put(
        `${environment.apiUrl}/secure/events/${id}/disabled/${disabled}`,
        null
      )
      .pipe(
        // Adapt the raw items
        map(data => this.eventAdapter.adapt(data))
      );
  }

  addParticipant(participant: ParticipantI): Observable<Participant> {
    return this.http
      .post(
        `${environment.apiUrl}/events/${participant.eventId}/participant`,
        participant
      )
      .pipe(
        // Adapt the raw items
        map(data => this.participantAdapter.adapt(data))
      );
  }

  getParticipants(
    tenantId: string,
    eventId: string
  ): Observable<Participant[]> {
    return this.http
      .get(
        `${environment.apiUrl}/secure/tenants/${tenantId}/events/${eventId}/participants`
      )
      .pipe(
        // Adapt the raw items
        map((data: any[]) =>
          data.map(item => this.participantAdapter.adapt(item))
        )
      );
  }

  deleteParticipant(
    tenantId: string,
    eventId: string,
    participantId: number
  ): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/secure/tenants/${tenantId}/events/${eventId}/participants/${participantId}`
    );
  }

  downloadPdf(event: Event): void {
    const headers = new HttpHeaders();
    headers.set('Accept', 'application/pdf');
    this.http
      .get(event.downloadLink(), {
        headers: headers,
        responseType: 'blob',
      })
      .subscribe(pdfBlob => {
        const blob = new Blob([pdfBlob], { type: 'application/pdf' });
        const fileName = `Teilnehmerliste ${event.displayName()} - ${event.displayDate()}.pdf`;
        saveAs(blob, fileName);
      });
  }
}
