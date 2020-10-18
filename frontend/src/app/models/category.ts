import { CategoryI } from '../../../../common/category';
import { Injectable } from '@angular/core';
import { Adapter } from '../helpers/adapter';

export class Category implements CategoryI {
  id: string;
  tenantId: string;
  name: string;
  icon?: string;

  constructor(item?: any) {
    if (item) {
      this.id = item.id;
      this.tenantId = item.tenantId;
      this.name = item.name;
      this.icon = item.icon;
    }
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
