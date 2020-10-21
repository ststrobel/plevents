import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/services/app.service';
import { UserService } from 'src/app/services/user.service';
import { ROUTES } from '../../../../../common/frontend.routes';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss'],
})
export class PasswordResetComponent implements OnInit, OnDestroy {
  private userSubscription: Subscription;
  error: string;
  loading: boolean = false;
  submitted: boolean = false;
  passwordForm: FormGroup = new FormGroup({
    password: new FormControl('', Validators.required),
  });
  noCode: boolean = false;
  passwordSet: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.appService.user.subscribe(user => {
      if (user) {
        this.router.navigate([`/${ROUTES.PROFILE}`]);
      }
    });
    if (!this.route.snapshot.queryParams.code) {
      this.noCode = true;
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onSubmit(): void {
    if (this.noCode) {
      return;
    }
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.userService
      .resetPassword(
        this.route.snapshot.queryParams.code,
        this.passwordForm.get('password').value
      )
      .subscribe(
        () => {
          this.passwordSet = true;
        },
        error => {
          console.error(error);
          this.error =
            'Es trat ein technischer Fehler auf. Bitte versuchen Sie es später erneut.';
        }
      );
  }
}
