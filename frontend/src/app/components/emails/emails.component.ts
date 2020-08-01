import { Component, OnInit } from "@angular/core";
import { EmailService } from "src/app/services/email.service";
import { Email } from "src/app/models/email";
import { reject, find } from "lodash";
import { FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
  selector: "app-emails",
  templateUrl: "./emails.component.html",
  styleUrls: ["./emails.component.scss"],
})
export class EmailsComponent implements OnInit {
  emails: Email[] = new Array<Email>();
  newEmailForm: FormGroup;

  constructor(private emailService: EmailService) {}

  ngOnInit() {
    this.emailService.getEmails().subscribe((emails) => {
      this.emails = emails;
    });
    this.newEmailForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
    });
  }

  delete(id: number): void {
    this.emailService.deleteEmail(id).subscribe(() => {
      this.emails = reject(this.emails, { id: id });
    });
  }

  addEmail(): void {
    if (this.newEmailForm.valid) {
      const mail = this.newEmailForm.get("email").value;
      this.emailService.createEmail(mail).subscribe((email: Email) => {
        // check that we don't have that email in the list already:
        if (find(this.emails, { address: mail }) === undefined) {
          this.emails.push(email);
        }
        this.newEmailForm.reset();
      });
    }
  }
}
