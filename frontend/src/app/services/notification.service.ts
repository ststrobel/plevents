// toast.service.ts
import { Component, Injectable, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

export interface ConfirmOptions {
  title: string;
  text: string;
  yesCallback?: Function;
  noCallback?: Function;
  yesButtonText?: string;
  noButtonText?: string;
  noButtonClass?: string;
  yesButtonClass?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  toasts: any[] = [];
  modalRef: BsModalRef;
  confirmOptions: ConfirmOptions = null;

  constructor(private modalService: BsModalService) {}

  // Push new Toasts to array with content and options
  private show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  // Callback method to remove Toast DOM element from view
  remove(toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  success(message: string): void {
    this.show(message, {
      classname: 'toast-success',
      delay: 2000,
      autohide: true,
    });
  }

  error(message: string): void {
    this.show(message, {
      classname: 'toast-error',
      delay: 2000,
      autohide: true,
    });
  }

  confirm(options: ConfirmOptions): void {
    // set defaults if not overridden
    options.yesButtonText = options.yesButtonText
      ? options.yesButtonText
      : 'Ja';
    options.noButtonText = options.noButtonText ? options.noButtonText : 'Nein';
    this.confirmOptions = options;
    this.modalRef = this.modalService.show(ConfirmModalComponent, {
      class: 'modal-md modal-dialog-centered',
      initialState: this.confirmOptions,
      ignoreBackdropClick: true,
    });
  }
}

/* This is a component which we pass in modal*/

@Component({
  selector: 'modal-content',
  template: `
    <div class="modal-header">
      <h4 class="modal-title pull-left">{{ title }}</h4>
    </div>
    <div class="modal-body">
      <p>{{ text }}</p>
    </div>
    <div class="modal-footer">
      <div class="w-100">
        <button
          type="button"
          class="btn {{ noButtonClass }}"
          style="width: 40%;"
          (click)="confirmNo()"
        >
          {{ noButtonText }}
        </button>
        <button
          type="button"
          class="btn {{ yesButtonClass }} float-right"
          style="width: 40%;"
          (click)="confirmYes()"
        >
          {{ yesButtonText }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent implements OnInit {
  title: string;
  text: string;
  yesCallback: Function;
  noCallback: Function;
  yesButtonText: string;
  noButtonText: string;
  noButtonClass: string = 'btn-light';
  yesButtonClass: string = 'btn-light';

  constructor(public modalRef: BsModalRef) {}

  ngOnInit() {}

  confirmYes(): void {
    if (this.yesCallback) {
      this.yesCallback();
    }
    this.modalRef.hide();
  }

  confirmNo(): void {
    if (this.noCallback) {
      this.noCallback();
    }
    this.modalRef.hide();
  }
}
