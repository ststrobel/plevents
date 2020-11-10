import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { reject, findIndex, find, filter, map, uniqBy, sortBy } from 'lodash';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Invitation } from 'src/app/models/invitation';
import { Tenant } from 'src/app/models/tenant';
import { TenantRelation } from 'src/app/models/tenant-relation';
import { User } from 'src/app/models/user';
import { Event } from 'src/app/models/event';
import { AppService } from 'src/app/services/app.service';
import { EventService } from 'src/app/services/event.service';
import { TenantService } from 'src/app/services/tenant.service';
import { UserService } from 'src/app/services/user.service';
import { ROUTES } from '../../../../../common/frontend.routes';
import { ROLE } from '../../../../../common/tenant-relation';
import { EventSeriesI } from '../../../../../common/event-series';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  ROLE = ROLE;
  inviteAdminForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });
  tenantUserRelations: TenantRelation[] = null;
  @Input()
  tenant: Tenant;
  invitations: Invitation[];
  invitedUser: string = null;
  userExists: string = null;
  modalRef: BsModalRef;
  selectedUser: User = null;
  singleEvents: Event[];
  eventSeries: EventSeriesI[];

  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private appService: AppService,
    private modalService: BsModalService,
    private router: Router,
    private eventService: EventService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    // load users for this tenant
    this.tenantService
      .getUsers(this.tenant.id)
      .subscribe((relations: TenantRelation[]) => {
        this.tenantUserRelations = sortBy(relations, 'user.name');
      });
    if (this.appService.hasRole(this.tenant.id, ROLE.OWNER)) {
      this.tenantService
        .getOpenInvitations(this.tenant.id)
        .subscribe((invitations: Invitation[]) => {
          this.invitations = sortBy(invitations, 'email');
        });
    } else {
      this.invitations = null;
    }
  }

  activate(user: User): void {
    this.userService
      .activate(this.tenant.id, user.id)
      .subscribe((activatedUser: User) => {
        const index = findIndex(this.tenantUserRelations, { userId: user.id });
        this.tenantUserRelations[index].active = true;
      });
  }

  inviteNewAdmin(): void {
    this.invitedUser = null;
    this.userExists = null;
    if (this.inviteAdminForm.invalid) {
      this.inviteAdminForm.markAllAsTouched();
      return;
    }
    // check if an active admin already exists with the entered email address
    const email = this.inviteAdminForm.get('email').value.toLowerCase();
    const existingMember = find(
      this.tenantUserRelations,
      (relation: TenantRelation) => {
        return relation.user.email.toLowerCase() === email;
      }
    );
    if (existingMember) {
      this.userExists =
        'Ein Nutzer mit Email Adresse ' + email + ' existiert bereits';
      return;
    }
    this.tenantService
      .addUser(this.tenant.id, this.inviteAdminForm.get('email').value)
      .subscribe(
        (invitation: Invitation) => {
          // only add the invitation to the list if there is no invitation with this email yet
          if (!find(this.invitations, { email: invitation.email })) {
            this.invitations.push(invitation);
          }
          this.invitedUser = invitation.email + ' wurde eingeladen';
          this.inviteAdminForm.reset();
        },
        error => {
          console.error(error);
          this.notification.error('Es trat ein Fehler auf');
        }
      );
  }

  delete(user: User): void {
    this.notification.confirm({
      title: 'Nutzer entfernen?',
      text: 'Wirklich diesen Nutzer entfernen?',
      yesButtonClass: 'btn-danger',
      yesButtonText: 'Entfernen',
      yesCallback: () => {
        this.userService.removeFromTenant(this.tenant.id, user.id).subscribe(
          () => {
            this.tenantUserRelations = reject(this.tenantUserRelations, {
              userId: user.id,
            });
            // if the user removed himself, jump to the profile:
            if (user.id === this.appService.getCurrentUser().id) {
              this.tenantService.getAll().subscribe();
              this.router.navigate([`/${ROUTES.PROFILE}`]);
            }
          },
          error => {
            console.error(error);
            this.notification.error('Beim Löschen trat leider ein Fehler auf!');
          }
        );
      },
    });
  }

  assignRole(relation: TenantRelation, role: ROLE): void {
    relation.role = role;
    this.userService
      .setRole(relation.tenantId, relation.userId, role)
      .subscribe(() => {
        this.notification.success('Rolle zugewiesen');
      });
  }

  revokeInvitation(invitation: Invitation): void {
    this.notification.confirm({
      title: 'Einladung zurückziehen?',
      text: 'Möchten Sie die Einladung wirklich zurückziehen?',
      yesButtonClass: 'btn-danger',
      yesButtonText: 'Ja',
      yesCallback: () => {
        this.tenantService
          .revokeOpenInvitations(invitation.tenantId, invitation.id)
          .subscribe(
            () => {
              this.notification.success('Die Einladung wurde zurückgezogen');
              this.invitations = reject(this.invitations, invitation);
            },
            error => {
              console.error(error);
              this.notification.error('Es trat ein Fehler auf');
            }
          );
      },
    });
  }

  showEventRelations(user: User, template: TemplateRef<any>): void {
    this.selectedUser = user;
    this.modalRef = this.modalService.show(template);
    // load the events for the client
    this.eventService
      .getEvents(this.tenant.id, null, null, true)
      .subscribe((events: Event[]) => {
        this.singleEvents = filter(events, event => event.singleOccurence);
        this.eventSeries = uniqBy(
          map(
            filter(events, event => event.eventSeries),
            'eventSeries'
          ),
          'id'
        );
      });
  }

  toggleAccessOnEvent(eventId: string): void {
    if (this.selectedUser.hasAccessToEvent(eventId)) {
      this.userService
        .denyAccessToEvent(this.tenant.id, this.selectedUser.id, eventId)
        .subscribe(() => {
          this.selectedUser.eventRelations = reject(
            this.selectedUser.eventRelations,
            relation => relation.eventId === eventId
          );
        });
    } else {
      this.userService
        .allowAccessToEvent(this.tenant.id, this.selectedUser.id, eventId)
        .subscribe(relation => {
          this.selectedUser.eventRelations.push(relation);
        });
    }
  }

  toggleAccessOnEventSeries(eventSeriesId: string): void {
    if (this.selectedUser.hasAccessToEvent(eventSeriesId)) {
      this.userService
        .denyAccessToEventSeries(
          this.tenant.id,
          this.selectedUser.id,
          eventSeriesId
        )
        .subscribe(() => {
          this.selectedUser.eventRelations = reject(
            this.selectedUser.eventRelations,
            relation => relation.eventSeriesId === eventSeriesId
          );
        });
    } else {
      this.userService
        .allowAccessToEventSeries(
          this.tenant.id,
          this.selectedUser.id,
          eventSeriesId
        )
        .subscribe(relation => {
          this.selectedUser.eventRelations.push(relation);
        });
    }
  }
}
