import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/services/app.service';
import { UserService } from 'src/app/services/user.service';
import { ROUTES } from '../../../../../common/frontend.routes';

@Component({
  selector: 'app-password-forgotten',
  templateUrl: './password-forgotten.component.html',
  styleUrls: ['./password-forgotten.component.scss'],
})
export class PasswordForgottenComponent implements OnInit {
  resetForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  loading = false;
  returnUrl: string;
  userSubscription: Subscription;
  passwordResetStatus = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private appService: AppService
  ) {
    // redirect to home if already logged in
    if (this.appService.getCurrentUser()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    // check if there is a logged-in user already. if so, forward directly to the profile
    this.userSubscription = this.appService.user.subscribe(user => {
      if (user) {
        this.router.navigate([`/${ROUTES.PROFILE}`]);
      }
    });
  }

  requestPasswordReset(): void {
    // if a valid email is given, use that email to send a password reset mail to
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.userService
      .initiatePasswordReset(this.resetForm.get('email').value)
      .subscribe(
        () => {
          this.passwordResetStatus = 'success';
          this.loading = false;
        },
        error => {
          console.error(error);
          this.passwordResetStatus = 'error';
          this.loading = false;
        }
      );
  }
}
