import * as express from 'express';
import { CategoryI } from '../../../common/category';
import { CategoryService } from '../services/category.service';

export class CategoryController {
  public static register(app: express.Application): void {
    app.get('/tenants/:path/categories', async (req, res) => {
      res.send(
        await CategoryService.get().getCategoriesByTenantPath(req.params.path)
      );
    });

    app.delete('/secure/categories/:categoryId', async (req, res) => {
      CategoryService.get().deleteCategory(req.params.id);
      res.status(200).send({ message: 'Category deleted' });
    });

    app.post('/secure/categories', async (req, res) => {
      const categoryI = req.body as CategoryI;
      const category = await CategoryService.get().addCategory(categoryI);
      res.status(201).send(category);
    });
  }
}
