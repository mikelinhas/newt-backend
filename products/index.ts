import { AzureFunction, Context, HttpRequest, HttpMethod } from "@azure/functions"

import router from "./router"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    await router(context, req)
};

export default httpTrigger;

// router.get('/', products.find)
// router.post('/', validator.create, products.create)
// router.get('/:id', vlaidator.get, products.get)
// router.patch('/:id', validator.update, products.update)
// router.delete('/:id', products.deleteProduct)
