import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Category, CategoryAdapter } from '../models/category';
import { CategoryI } from '../../../../common/category';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient, private adapter: CategoryAdapter) {}

  getCategorys(tenantPath: string): Observable<Category[]> {
    return this.http
      .get(`${environment.apiUrl}/tenants/${tenantPath}/categories`)
      .pipe(
        // Adapt the raw items
        map((data: any[]) => data.map(item => this.adapter.adapt(item)))
      );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/secure/categories/${id}`);
  }

  createCategory(category: CategoryI): Observable<Category> {
    return this.http
      .post(`${environment.apiUrl}/secure/categories`, category)
      .pipe(
        // Adapt the raw items
        map((data: any) => this.adapter.adapt(data))
      );
  }
}
