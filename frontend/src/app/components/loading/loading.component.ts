import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent implements OnInit {
  @Input()
  textClass: string = '';

  constructor() {}

  ngOnInit(): void {}
}
