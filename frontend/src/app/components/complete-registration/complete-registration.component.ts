import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-complete-registration',
  templateUrl: './complete-registration.component.html',
  styleUrls: ['./complete-registration.component.scss'],
})
export class CompleteRegistrationComponent implements OnInit {
  noCode: boolean = false;
  activated: boolean = false;
  error: boolean = false;
  loggedIn: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // first of all, make sure that there is no user logged-in currently:
    if (localStorage.getItem('user')) {
      this.loggedIn = true;
      return;
    }
    if (this.route.snapshot.queryParams.code) {
      this.userService
        .finishRegistration(this.route.snapshot.queryParams.code)
        .subscribe(
          () => {
            this.activated = true;
          },
          error => {
            console.error(error);
            this.error = true;
          }
        );
    } else {
      this.noCode = true;
    }
  }
}
