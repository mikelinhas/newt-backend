import { Request, Response } from "express"
import { getDatabaseConnection } from "../../database/utils"
import { createMatchObjectFromQuery } from "../../domains/products/helpers"
import { ProductionDraft } from "../models/productionDrafts"
import { errorHandler } from "./utils/errors"

const db = getDatabaseConnection()

export async function findProductionDrafts(req: Request, res: Response) {
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

export async function findProductionDraft(req: Request, res: Response) {
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

    if (!draft) {
      throw new Error("Could not find the draft")
    }
    draft.productsByCategories = draftItems
    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function getProductionDraftInfo(req: Request, res: Response) {
  try {
    const draft_number = req.params.draft_number
    const draft = await db
      .collection('production.drafts')
      .findOne({ draft_number })

    if (!draft) {
      throw new Error("Could not find the draft")
    }
    delete draft.items
    res.status(200).json(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

// WARNING - this code is a bit duplicated in both prodution.js and productionDrafts.js
export async function getProductionDraftMaterialConsumption(req: Request, res: Response) {
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

export async function getProductionDraftPreview(req: Request, res: Response) {
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
    if (!draft) {
      throw new Error("Could not find the draft")
    }
    draft.items = draftItems
    draft.productsByCategories = groupedDraftItems

    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function modifyDraftOrderQuantity(req: Request, res: Response) {
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

async function modifyDraftField(draft_number: any, product_id: any, field: any, quantity: any) {
  const fieldToModify = 'items.$.' + field
  const result = await db.collection('production.drafts').updateOne(
    {
      draft_number,
      items: {
        $elemMatch: {
          product_id,
        },
      },
    },
    { $set: { [fieldToModify]: quantity } },
    { upsert: false }
  )
  if (!result.acknowledged) {
    throw new Error('Not modified correctly')
  }
}

export async function deleteProductionDraft(req: Request, res: Response) {
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

export async function createProductionDraft(req: Request, res: Response) {
  try {
    const { producer_id } = req.body
    const newDraftNumber = await getNewProductionDraftNumber(producer_id)
    const producer = await db
      .collection('producers')
      .findOne({ _id: producer_id })
    if (!producer) {
      throw new Error("could not find the producer")
    }
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
    const draft = new ProductionDraft({
      draft_number: newDraftNumber,
      producer_id: producer._id,
      producer_name: producer.name,
      username: 'Mike',
      items,
    })
    await db.collection('production.drafts').insertOne(draft)
    res.status(200).send(draft)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function getNewProductionDraftNumber(producer_id: any) {
  const { name } = await db
    .collection('producers')
    .findOne({ _id: producer_id }) as any
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

export async function getProductionDraftCategories(req: Request, res: Response) {
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

export async function getProductionDraftSubcategories(req: Request, res: Response) {
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

export async function getProductionDraftNames(req: Request, res: Response) {
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

export async function getProductionDraftColors(req: Request, res: Response) {
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

export async function getProductionDraftSizes(req: Request, res: Response) {
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
