import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { EmailAdapter, Email } from "../models/email";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
@Injectable({ providedIn: "root" })
export class EmailService {
  constructor(private http: HttpClient, private adapter: EmailAdapter) {}

  getEmails(): Observable<Email[]> {
    return this.http.get(`${environment.apiUrl}/secure/emails`).pipe(
      // Adapt the raw items
      map((data: any[]) => data.map((item) => this.adapter.adapt(item)))
    );
  }

  deleteEmail(id: number): Observable<any> {
    console.log("About to delete: ", id);
    return this.http.delete(`${environment.apiUrl}/secure/emails/${id}`);
  }

  createEmail(address: string): Observable<Email> {
    return this.http
      .post(`${environment.apiUrl}/secure/emails`, { mail: address })
      .pipe(
        // Adapt the raw items
        map((data) => this.adapter.adapt(data))
      );
  }
}
