import { Component, OnInit } from '@angular/core';
import { ROUTES } from '../../../../../common/frontend.routes';
import Viewer from 'viewerjs';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
  ROUTES = ROUTES;

  constructor() {}

  ngOnInit(): void {
    const gallery = new Viewer(document.getElementById('imageGallery'), {
      toolbar: false,
      movable: false,
    });
  }

  scrollToElement(elementId: string): void {
    document.getElementById(elementId).scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }

  showImage(imageID: string): void {
    const viewer = new Viewer(document.getElementById(imageID), {
      inline: false,
      navbar: false,
      toolbar: false,
    });
  }
}
