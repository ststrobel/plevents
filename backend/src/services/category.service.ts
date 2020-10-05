import { Category } from '../models/category';
import { CategoryI } from '../../../common/category';
import { Tenant } from '../models/tenant';

export class CategoryService {
  private static singleton: CategoryService = null;

  /**
   * get the service instance
   */
  static get(): CategoryService {
    if (CategoryService.singleton === null) {
      CategoryService.singleton = new CategoryService();
    }
    return CategoryService.singleton;
  }

  getCategories(tenantId: string): Promise<Category[]> {
    return Category.find({ where: { tenantId } });
  }

  async getCategoriesByTenantPath(path: string): Promise<Category[]> {
    // first, find the tenant
    const tenant = await Tenant.findOneOrFail({ where: { path } });
    return this.getCategories(tenant.id);
  }

  async addCategory(categoryI: CategoryI): Promise<Category> {
    const category = Object.assign(new Category(), categoryI) as Category;
    return await category.save();
  }

  deleteCategory(categoryId: string): void {
    Category.delete(categoryId);
  }
}
