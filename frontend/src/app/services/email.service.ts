import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { EmailAdapter, Email } from "../models/email";
import { Observable } from "rxjs";
@Injectable({ providedIn: "root" })
export class EmailService {
  constructor(private http: HttpClient, private adapter: EmailAdapter) {}

  getEmails(): Observable<Email[]> {
    return this.http.get("http://localhost:4201/secure/emails").pipe(
      // Adapt the raw items
      map((data: any[]) => data.map((item) => this.adapter.adapt(item)))
    );
  }

  deleteEmail(id: number): Observable<any> {
    console.log("About to delete: ", id);
    return this.http.delete(`http://localhost:4201/secure/email/${id}`);
  }

  createEmail(address: string): Observable<Email> {
    return this.http
      .post(`http://localhost:4201/secure/email`, { mail: address })
      .pipe(
        // Adapt the raw items
        map((data) => this.adapter.adapt(data))
      );
  }
}
