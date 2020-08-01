import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { Event, EventAdapter } from "../models/event";
import { EventI } from "../../../../common/event";
import { ParticipantI } from "../../../../common/participant";
import { Participant, ParticipantAdapter } from "../models/participant";
import { saveAs } from "file-saver";

@Injectable({ providedIn: "root" })
export class EventService {
  constructor(
    private http: HttpClient,
    private adapter: EventAdapter,
    private participantAdapter: ParticipantAdapter
  ) {}

  getEvents(): Observable<Event[]> {
    return this.http.get("http://localhost:4201/events").pipe(
      // Adapt the raw items
      map((data: any[]) => data.map((item) => this.adapter.adapt(item)))
    );
  }

  createEvent(event: EventI): Observable<Event> {
    return this.http.post(`http://localhost:4201/secure/events`, event).pipe(
      // Adapt the raw items
      map((data) => this.adapter.adapt(data))
    );
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`http://localhost:4201/secure/events/${id}`);
  }

  setDisabled(id: number, disabled: boolean): Observable<Event> {
    return this.http
      .put(
        `http://localhost:4201/secure/events/${id}/disabled/${disabled}`,
        event
      )
      .pipe(
        // Adapt the raw items
        map((data) => this.adapter.adapt(data))
      );
  }

  addParticipant(participant: ParticipantI): Observable<Participant> {
    return this.http
      .post(
        `http://localhost:4201/events/${participant.EventId}/participant`,
        participant
      )
      .pipe(
        // Adapt the raw items
        map((data) => this.participantAdapter.adapt(data))
      );
  }

  downloadPdf(event: Event): void {
    const headers = new HttpHeaders();
    headers.set("Accept", "application/pdf");
    this.http
      .get(event.downloadLink(), {
        headers: headers,
        responseType: "blob",
      })
      .subscribe((pdfBlob) => {
        const blob = new Blob([pdfBlob], { type: "application/pdf" });
        saveAs(blob, "Teilnehmerliste.pdf");
      });
  }
}
