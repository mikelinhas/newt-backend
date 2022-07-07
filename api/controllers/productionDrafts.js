const models = require('../models/productionDrafts')
const database = require('../../database/utils')
const db = database.getDatabaseConnection()

const errorHandler = (error, res) => {
  console.error(error)
  res.status(500).send(error)
}

const findProductionDrafts = async function (req, res) {
  try {
    const result = await db
      .collection('production.drafts')
      .find()
      .project({ items: 0 })
      .sort({ date: -1 })
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const findProductionDraft = async function (req, res) {
  try {
    const draft_number = req.params.draft_number
    const draft = await db
      .collection('production.drafts')
      .findOne({ draft_number })

    const mongoQuery = createMatchObjectFromQuery(req.query)
    const draftItems = await db
      .collection('production.drafts')
      .aggregate([
        { $match: { draft_number } },
        { $project: { items: 1 } },
        { $unwind: '$items' },
        { $replaceRoot: { newRoot: '$items' } },
        // filter with query
        {
          $match: mongoQuery,
        },
        {
          $group: {
            _id: '$name',
            name: { $first: '$name' },
            category: { $first: '$category' },
            subcategory: { $first: '$subcategory' },
            products: { $push: '$$ROOT' },
          },
        },
        { $sort: { name: 1 } },
        {
          $group: {
            _id: '$category',
            category: { $first: '$category' },
            subcategory: { $first: '$subcategory' },
            families: { $push: '$$ROOT' },
          },
        },
      ])
      .toArray()
    draft.productsByCategories = draftItems
    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

const getProductionDraftInfo = async function (req, res) {
  try {
    const draft_number = req.params.draft_number
    const draft = await db
      .collection('production.drafts')
      .findOne({ draft_number })
    delete draft.items
    res.status(200).json(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

// WARNING - this code is a bit duplicated in both prodution.js and productionDrafts.js
const getProductionDraftMaterialConsumption = async (req, res) => {
  try {
    const draft_number = req.params.draft_number
    const result = await db
      .collection('production.drafts')
      .aggregate([
        { $match: { draft_number } },
        { $unwind: '$items' },
        { $replaceRoot: { newRoot: '$items' } },
        {
          $project: {
            _id: { $toObjectId: '$product_id' },
            product_id: 1,
            new_ordered: 1,
          },
        },
        { $match: { new_ordered: { $gt: 0 } } },
        // now we have a list of products with new_ordered value
        {
          $lookup: {
            from: 'materials.consumption',
            let: { productId: '$product_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$product_id', '$$productId'],
                  },
                },
              },
            ],
            as: 'boms',
          },
        },
        { $unwind: '$boms' },
        {
          $project: {
            _id: { $toObjectId: '$boms.material_id' },
            material_id: 1,
            quantity: {
              $multiply: ['$new_ordered', '$boms.quantity'],
            },
          },
        },
        {
          $group: {
            _id: '$_id',
            quantity: { $sum: '$quantity' },
          },
        },
        {
          $lookup: {
            from: 'materials',
            let: { materialId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$materialId'],
                  },
                },
              },
            ],
            as: 'material_info',
          },
        },
        {
          $project: {
            name: { $first: '$material_info.name' },
            description: { $first: '$material_info.description' },
            external_ref: { $first: '$material_info.external_ref' },
            unit_price: { $first: '$material_info.unit_price' },
            measure_unit: { $first: '$material_info.measure_unit' },
            supplier_id: { $first: '$material_info.supplier_id' },
            quantity: 1,
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const getProductionDraftPreview = async function (req, res) {
  try {
    const draft_number = req.params.draft_number
    const draft = await db
      .collection('production.drafts')
      .findOne({ draft_number })

    const draftItems = await db
      .collection('production.drafts')
      .aggregate([
        { $match: { draft_number } },
        { $project: { items: 1 } },
        { $unwind: '$items' },
        { $replaceRoot: { newRoot: '$items' } },
        // filter with query
        {
          $match: { new_ordered: { $gt: 0 } },
        },
      ])
      .toArray()

    const groupedDraftItems = await db
      .collection('production.drafts')
      .aggregate([
        { $match: { draft_number } },
        { $project: { items: 1 } },
        { $unwind: '$items' },
        { $replaceRoot: { newRoot: '$items' } },
        // filter with query
        {
          $match: { new_ordered: { $gt: 0 } },
        },
        {
          $group: {
            _id: '$name',
            name: { $first: '$name' },
            category: { $first: '$category' },
            subcategory: { $first: '$subcategory' },
            products: { $push: '$$ROOT' },
          },
        },
        { $sort: { name: 1 } },
        {
          $group: {
            _id: '$category',
            category: { $first: '$category' },
            subcategory: { $first: '$subcategory' },
            families: { $push: '$$ROOT' },
          },
        },
      ])
      .toArray()

    draft.items = draftItems
    draft.productsByCategories = groupedDraftItems

    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

const modifyDraftOrderQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body
    const draft_number = req.params.draft_number
    await modifyDraftField(draft_number, product_id, 'new_ordered', quantity)
    const draft = await db
      .collection('production.drafts')
      .findOne({ draft_number })
    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function modifyDraftField(draft_number, product_id, field, quantity) {
  const fieldToModify = 'items.$.' + field
  const { result } = await db.collection('production.drafts').updateOne(
    {
      draft_number,
      items: {
        $elemMatch: {
          product_id,
        },
      },
    },
    { $set: { [fieldToModify]: quantity } },
    { safe: true, upsert: false }
  )
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

const deleteProductionDraft = async (req, res) => {
  try {
    const draft_number = req.params.draft_number
    const { deletedCount } = await db
      .collection('production.drafts')
      .deleteOne({ draft_number })
    if (deletedCount) {
      res.status(200).send({ deletedCount })
    } else {
      throw new Error('Not deleted correctly')
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

const createProductionDraft = async function (req, res) {
  try {
    const { producer_id } = req.body
    const newDraftNumber = await getNewProductionDraftNumber(producer_id)
    const producer = await db
      .collection('producers')
      .findOne({ _id: producer_id })
    const items = await db
      .collection('products')
      .aggregate([
        { $match: { enabled: true } },
        {
          $lookup: {
            from: 'products.families',
            let: { familyId: '$family_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toObjectId: '$$familyId' }, '$_id'],
                  },
                },
              },
            ],
            as: 'family',
          },
        },
        {
          $project: {
            product_id: 1,
            category: { $first: '$family.category' },
            subcategory: { $first: '$family.subcategory' },
            name: { $first: '$family.name' },
            color: 1,
            size: 1,
            stock: 1,
          },
        },
        {
          $match: { category: { $in: producer.product_categories } },
        },
        {
          $lookup: {
            from: 'production',
            let: { productId: '$_id' },
            pipeline: [
              { $match: { closed: false } },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: {
                    $eq: [{ $toObjectId: '$items.product_id' }, '$$productId'],
                  },
                },
              },
            ],
            as: 'orders',
          },
        },
        {
          $project: {
            ordered: { $sum: '$orders.items.ordered' },
            received: { $sum: '$orders.items.finished' },
            product_id: 1,
            category: 1,
            subcategory: 1,
            name: 1,
            color: 1,
            size: 1,
            stock: 1,
          },
        },
        { $sort: { name: 1 } },
        { $sort: { category: 1 } },
      ])
      .toArray()
    const draft = new models.ProductionDraft({
      draft_number: newDraftNumber,
      producer_id: producer._id,
      producer_name: producer.name,
      username: 'Mike',
      items,
    })
    await db.collection('production.drafts').insert(draft)
    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function getNewProductionDraftNumber(producer_id) {
  const { name } = await db
    .collection('producers')
    .findOne({ _id: producer_id })
  const producerInitials = name.substring(0, 3).toUpperCase()
  const drafts = await db
    .collection('production.drafts')
    .find({ producer_id })
    .toArray()
  const highest = drafts.reduce((highest, draft) => {
    const draftNumber = draft.draft_number
    const number = Number(draftNumber.substr(draftNumber.length - 2))
    if (number > highest) {
      return number
    } else {
      return highest
    }
  }, 0)
  const newHighest = highest + 1
  const num = '0' + newHighest
  const paddedNumber = num.substr(num.length - 2)
  const newOrderNumber = producerInitials + '-' + paddedNumber
  return newOrderNumber
}

const getProductionDraftCategories = async function (req, res) {
  const draft_number = req.params.draft_number
  const categories = await db
    .collection('production.drafts')
    .aggregate([
      { $match: { draft_number } },
      { $project: { items: 1 } },
      { $unwind: '$items' },
      { $replaceRoot: { newRoot: '$items' } },
      { $group: { _id: '$category', name: { $first: '$category' } } },
      { $project: { _id: 0 } },
      { $sort: { name: 1 } },
    ])
    .toArray()
  res.status(200).send(categories)
}

const getProductionDraftSubcategories = async function (req, res) {
  const draft_number = req.params.draft_number
  const query = req.query || {}
  const subcategories = await db
    .collection('production.drafts')
    .aggregate([
      { $match: { draft_number } },
      { $project: { items: 1 } },
      { $unwind: '$items' },
      { $replaceRoot: { newRoot: '$items' } },
      { $match: query },
      { $group: { _id: '$subcategory', name: { $first: '$subcategory' } } },
      { $project: { _id: 0 } },
      { $sort: { name: 1 } },
    ])
    .toArray()
  res.status(200).send(subcategories)
}

const getProductionDraftNames = async function (req, res) {
  const draft_number = req.params.draft_number
  const query = req.query || {}
  const names = await db
    .collection('production.drafts')
    .aggregate([
      { $match: { draft_number } },
      { $project: { items: 1 } },
      { $unwind: '$items' },
      { $replaceRoot: { newRoot: '$items' } },
      { $match: query },
      { $group: { _id: '$name', name: { $first: '$name' } } },
      { $project: { _id: 0 } },
      { $sort: { name: 1 } },
    ])
    .toArray()
  res.status(200).send(names)
}

const getProductionDraftColors = async function (req, res) {
  const draft_number = req.params.draft_number
  const query = req.query || {}
  const colors = await db
    .collection('production.drafts')
    .aggregate([
      { $match: { draft_number } },
      { $project: { items: 1 } },
      { $unwind: '$items' },
      { $replaceRoot: { newRoot: '$items' } },
      { $match: query },
      { $group: { _id: '$color', name: { $first: '$color' } } },
      { $project: { _id: 0 } },
      { $sort: { name: 1 } },
    ])
    .toArray()
  res.status(200).send(colors)
}

const getProductionDraftSizes = async function (req, res) {
  const draft_number = req.params.draft_number
  const query = req.query || {}

  const sizes = await db
    .collection('production.drafts')
    .aggregate([
      { $match: { draft_number } },
      { $project: { items: 1 } },
      { $unwind: '$items' },
      { $replaceRoot: { newRoot: '$items' } },
      { $match: query },
      { $group: { _id: '$size', name: { $first: '$size' } } },
      { $project: { _id: 0 } },
      { $sort: { name: 1 } },
    ])
    .toArray()
  res.status(200).send(sizes)
}

const createMatchObjectFromQuery = function (query) {
  const mongoMatchObject = Object.entries(query).reduce(
    (mongoMatchObject, [key, value]) => {
      // Note: Value can be either a string or an Array
      let mongoMatchValue
      try {
        const parsedValue = JSON.parse(value)
        if (Array.isArray(parsedValue)) {
          mongoMatchValue = { $in: JSON.parse(value) }
        } else {
          mongoMatchValue = value
        }
      } catch (error) {
        mongoMatchValue = value
      }
      mongoMatchObject[key] = mongoMatchValue
      return mongoMatchObject
    },
    {}
  )
  return mongoMatchObject
}

module.exports = {
  findProductionDrafts,
  findProductionDraft,
  getProductionDraftInfo,
  getProductionDraftMaterialConsumption,
  getProductionDraftPreview,
  createProductionDraft,
  modifyDraftOrderQuantity,
  deleteProductionDraft,
  getProductionDraftCategories,
  getProductionDraftSubcategories,
  getProductionDraftNames,
  getProductionDraftColors,
  getProductionDraftSizes,
}
