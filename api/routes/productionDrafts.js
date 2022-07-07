const express = require('express')
const router = express.Router()
const productionDrafts = require('../controllers/productionDrafts')

router.get('/', productionDrafts.findProductionDrafts)
router.post('/', productionDrafts.createProductionDraft)

router.get('/:draft_number', productionDrafts.findProductionDraft)
router.get('/:draft_number/info', productionDrafts.getProductionDraftInfo)
router.get(
  '/:draft_number/materials',
  productionDrafts.getProductionDraftMaterialConsumption
)
router.patch(
  '/:draft_number/ordered',
  productionDrafts.modifyDraftOrderQuantity
)
router.delete('/:draft_number', productionDrafts.deleteProductionDraft)

router.get('/:draft_number/preview', productionDrafts.getProductionDraftPreview)
router.get(
  '/:draft_number/categories',
  productionDrafts.getProductionDraftCategories
)
router.get(
  '/:draft_number/subcategories',
  productionDrafts.getProductionDraftSubcategories
)
router.get('/:draft_number/names', productionDrafts.getProductionDraftNames)
router.get('/:draft_number/colors', productionDrafts.getProductionDraftColors)
router.get('/:draft_number/sizes', productionDrafts.getProductionDraftSizes)

module.exports = router
