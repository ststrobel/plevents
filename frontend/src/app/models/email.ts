import { EmailI } from "../../../../common/email";
import { Injectable } from "@angular/core";
import { Adapter } from "../helpers/adapter";

export class Email implements EmailI {
  id: number;
  address: string;

  constructor(address: string, id?: number) {
    this.address = address;
    if (id) {
      this.id = id;
    }
  }
}

@Injectable({
  providedIn: "root",
})
export class EmailAdapter implements Adapter<Email> {
  adapt(item: any): Email {
    return new Email(item.address, item.id);
  }
}
