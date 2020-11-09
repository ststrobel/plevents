import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { clone } from 'lodash';
import { User } from 'src/app/models/user';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { NotificationService } from 'src/app/services/notification.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: User = null;
  nameForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
  });
  passwordForm: FormGroup = new FormGroup({
    oldPassword: new FormControl('', Validators.required),
    newPassword: new FormControl('', Validators.required),
  });

  operationOngoing: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthenticationService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.operationOngoing = true;
    this.userService.getProfile().subscribe((user: User) => {
      this.user = user;
      this.authService.update(this.user);
      this.nameForm.get('name').setValue(this.user.name);
      this.operationOngoing = false;
    });
  }

  isInvalid(formControlName: string): boolean {
    if (this.nameForm.contains(formControlName)) {
      return (
        this.nameForm.get(formControlName).invalid &&
        this.nameForm.get(formControlName).touched
      );
    }
    if (this.passwordForm.contains(formControlName)) {
      return (
        this.passwordForm.get(formControlName).invalid &&
        this.passwordForm.get(formControlName).touched
      );
    }

    return false;
  }

  updateName(): void {
    if (this.nameForm.invalid) {
      this.nameForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    const updatePayload = clone(this.user);
    updatePayload.name = this.nameForm.get('name').value;
    this.userService.updateProfile(updatePayload).subscribe(
      (updatedUser: User) => {
        this.user = updatedUser;
        this.authService.update(this.user);
        this.notification.success('Name geändert');
        this.operationOngoing = false;
      },
      error => {
        console.error(error);
        this.notification.error('Es trat ein Fehler auf');
        this.operationOngoing = false;
      }
    );
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.operationOngoing = true;
    this.userService
      .updatePassword(
        this.passwordForm.get('oldPassword').value,
        this.passwordForm.get('newPassword').value
      )
      .subscribe(
        () => {
          this.notification.success('Passwort geändert');
          this.authService.update(
            this.user,
            this.passwordForm.get('newPassword').value
          );
          this.operationOngoing = false;
          this.passwordForm.reset();
        },
        error => {
          console.error(error);
          this.notification.error('Es trat ein Fehler auf');
          this.operationOngoing = false;
        }
      );
  }

  deleteProfile(): void {
    this.notification.confirm({
      title: 'Account löschen?',
      text:
        'Möchten Sie wirklich Ihr persönliches Profil löschen? Alle Daten werden sofort gelöscht. Diese Aktion kann nicht rückgängig gemacht werden!',
      yesButtonClass: 'btn-danger',
      yesButtonText: 'Löschen',
      yesCallback: () => {
        this.operationOngoing = true;
        this.userService.deleteProfile().subscribe(
          () => {
            this.notification.success('Ihr Profil wurde gelöscht');
            this.authService.logout();
          },
          error => {
            console.error(error);
            this.notification.error('Es trat ein Fehler auf');
            this.operationOngoing = false;
          }
        );
      },
    });
  }
}
