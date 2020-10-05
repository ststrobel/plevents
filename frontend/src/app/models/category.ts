import { CategoryI } from '../../../../common/category';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';

export class Category implements CategoryI {
  id: string;
  tenantId: string;
  name: string;

  constructor(item?: any) {
    this.id = item.id;
    this.tenantId = item.tenantId;
    this.name = item.name;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CategoryAdapter implements Adapter<Category> {
  adapt(item: any): Category {
    return new Category(item);
  }
}
