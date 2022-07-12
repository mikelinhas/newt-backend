import { Context, HttpRequest } from "@azure/functions"
import * as controller from './controllers'
import * as validator from './validators'

export default async function router(context: Context, req: HttpRequest) {
  if (hasIdParameter(req)) {
    switch (req.method) {
      case 'GET':
        console.log("here is your product")
        break;
      case 'PATCH':
        console.log("I patched the product")
        break;
      case 'DELETE':
        console.log("I deleted the product")
        break;
    }
  } else {
    switch (req.method) {
      case 'GET':
        await controller.find(context, req)
        break;

      case 'POST':
        await validator.create(context, req)
        await controller.create(context, req)
        break;
    }
  }
}

function hasIdParameter(req) {
  return req.params.id ? true : false
}



// router.get('/', products.find)
// router.post('/', validator.create, products.create)
// router.patch('/:id', validator.update, products.update)
// router.delete('/:id', products.deleteProduct)

// router.get('/families', products.findFamilies)
// router.get('/families/:id', products.findFamily)
// router.post('/families', validator.createFamily, products.createFamily)
// router.put('/families/:id', validator.updateFamily, products.updateFamily)
// router.delete('/families/:id', products.deleteFamily)

// router.get('/grouped/categories', products.findAndGroupByCategories)
// router.get('/categories', products.findCategories)
// router.get('/subcategories', products.findSubcategories)
// router.get('/names', products.findNames)
// router.get('/sizes', products.findSizes)
// router.get('/colors', products.findColors)
