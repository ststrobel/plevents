import { Component, OnInit } from '@angular/core';
import { ROUTES } from '../../../../../common/frontend.routes';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
  ROUTES = ROUTES;

  constructor() {}

  ngOnInit(): void {}
}
