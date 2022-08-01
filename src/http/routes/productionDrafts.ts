import { Router } from "express"
import * as controller from "../controllers/productionDrafts"

export const ProductionDraftsRouter = Router()

ProductionDraftsRouter.get('/', controller.findProductionDrafts)
ProductionDraftsRouter.post('/', controller.createProductionDraft)

ProductionDraftsRouter.get('/:draft_number', controller.findProductionDraft)
ProductionDraftsRouter.get('/:draft_number/info', controller.getProductionDraftInfo)
ProductionDraftsRouter.get(
  '/:draft_number/materials',
  controller.getProductionDraftMaterialConsumption
)
ProductionDraftsRouter.patch(
  '/:draft_number/ordered',
  controller.modifyDraftOrderQuantity
)
ProductionDraftsRouter.delete('/:draft_number', controller.deleteProductionDraft)

ProductionDraftsRouter.get('/:draft_number/preview', controller.getProductionDraftPreview)
ProductionDraftsRouter.get(
  '/:draft_number/categories',
  controller.getProductionDraftCategories
)
ProductionDraftsRouter.get(
  '/:draft_number/subcategories',
  controller.getProductionDraftSubcategories
)
ProductionDraftsRouter.get('/:draft_number/names', controller.getProductionDraftNames)
ProductionDraftsRouter.get('/:draft_number/colors', controller.getProductionDraftColors)
ProductionDraftsRouter.get('/:draft_number/sizes', controller.getProductionDraftSizes)

