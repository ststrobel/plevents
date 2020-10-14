import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { clone, reject } from 'lodash';
import { Category } from 'src/app/models/category';
import { Tenant } from 'src/app/models/tenant';
import { AppService } from 'src/app/services/app.service';
import { CategoryService } from 'src/app/services/category.service';
import { ROLE } from '../../../../../common/tenant-relation';

@Component({
  selector: 'category-management',
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss'],
})
export class CategoryManagementComponent implements OnInit {
  @Input()
  tenant: Tenant;
  categories: Category[];
  ROLE = ROLE;
  categoriesBeingEdited: string[] = new Array<string>();
  categoryForm: FormGroup = new FormGroup({
    newCategory: new FormControl('', Validators.required),
  });

  constructor(
    private categoryService: CategoryService,
    public appService: AppService
  ) {}

  ngOnInit(): void {
    this.categoryService
      .getCategories(this.tenant.path)
      .subscribe(categories => {
        this.categories = categories;
      });
  }

  isBeingEdited(categoryId: string): boolean {
    return this.categoriesBeingEdited.includes(categoryId);
  }

  edit(category: Category): void {
    this.categoryForm.addControl(
      category.id,
      new FormControl(category.name, Validators.required)
    );
    this.categoriesBeingEdited.push(category.id);
  }

  save(category?: Category): void {
    if (category) {
      // an existing category needs to be updated
      const categoryToUpdate = clone(category);
      categoryToUpdate.name = this.categoryForm.get(categoryToUpdate.id).value;
      if (!this.validationPassed(categoryToUpdate)) {
        return;
      }
      this.categoryService.updateCategory(categoryToUpdate).subscribe(
        (updatedCategory: Category) => {
          this.categories.splice(
            this.categories.indexOf(category),
            1,
            updatedCategory
          );
          this.categoriesBeingEdited.splice(
            this.categoriesBeingEdited.indexOf(category.id),
            1
          );
          alert('Kategorie aktualisiert');
        },
        error => {
          console.error(error);
          alert('Fehler beim Erstellen der neuen Kategorie');
        }
      );
    } else {
      // a new category shall be added
      const newCategory = new Category();
      newCategory.name = this.categoryForm.get('newCategory').value;
      newCategory.tenantId = this.tenant.id;
      if (!this.validationPassed(newCategory)) {
        return;
      }
      this.categoryService.createCategory(newCategory).subscribe(
        (createdCategory: Category) => {
          this.categories.push(createdCategory);
          this.categoryForm.get('newCategory').reset();
          alert('Neue Kategorie erstellt');
        },
        error => {
          console.error(error);
          alert('Fehler beim Erstellen der neuen Kategorie');
        }
      );
    }
  }

  deleteCategory(category: Category): void {
    if (confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
      this.categoryService.deleteCategory(category.id).subscribe(
        () => {
          this.categories = reject(this.categories, { id: category.id });
          alert('Kategorie gelöscht');
        },
        error => {
          console.error(error);
          alert('Fehler beim Löschen der Kategorie');
        }
      );
    }
  }

  validationPassed(category: Category): boolean {
    if (category.name.length === 0) {
      alert('Bitte vergeben Sie einen Namen für die Kategorie');
      return false;
    }
    if (!this.isCategoryUnique(category)) {
      alert('Diese Kategorie existiert bereits');
      return false;
    }
    return true;
  }

  /**
   * checks if the name is already existing in another category
   * @param category
   */
  isCategoryUnique(category: Category): boolean {
    for (let i = 0; i < this.categories.length; i++) {
      if (
        this.categories[i].name.toLowerCase() === category.name.toLowerCase() &&
        this.categories[i].id !== category.id
      ) {
        return false;
      }
    }
    return true;
  }
}
