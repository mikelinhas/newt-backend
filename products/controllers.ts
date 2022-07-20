import { Context, HttpRequest } from '@azure/functions';
import * as mongo from 'mongodb';
import { getDatabaseConnection } from '../database/connection';
import { errorHandler } from '../middleware/handler';
import { Product, ProductFamily } from './models'

let db;



const createMatchObjectFromQuery = function (query) {
  const mongoMatchObject = Object.entries(query).reduce(
    (mongoMatchObject, [key, value]) => {
      // Note: Value can be either a string or an Array
      let mongoMatchValue
      try {
        const parsedValue = JSON.parse(value as any)
        if (Array.isArray(parsedValue)) {
          mongoMatchValue = { $in: JSON.parse(value as any) }
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

// Products
export async function find(context: Context, req: HttpRequest) {
  try {
    const db = await getDatabaseConnection();
    const query = req.query || {}
    const result = await db.collection('products').find(query).toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function findFamilies(context: Context, req: HttpRequest) {
  try {
    const result = await db
      .collection('products.families')
      .find({})
      .sort({ category: 1 })
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function findFamily(context: Context, req: HttpRequest) {
  try {
    const _id = new mongo.ObjectId(req.params.id)
    const result = await db.collection('products.families').findOne({ _id })
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function findAndGroupByCategories(context: Context, req: HttpRequest) {
  try {
    const mongoQuery = createMatchObjectFromQuery(req.query)
    const result = await db
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
        // filter with query
        {
          $match: mongoQuery,
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
        { $sort: { category: 1 } },
      ])
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function create(context: Context, req: HttpRequest) {
  try {
    const db = await getDatabaseConnection();
    const product = new Product(req.body)
    const result = await db.collection('products').insertOne(product)
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function createFamily(context: Context, req: HttpRequest) {
  try {
    const { name, category, subcategory } = req.body
    const productFamily = new ProductFamily({ name, category, subcategory })
    await db.collection('products.families').insertOne(productFamily)
    const result = await db
      .collection('products.families')
      .findOne({ name: productFamily.name })
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function update(context: Context, req: HttpRequest) {
  const _id = new mongo.ObjectId(req.params.id)
  const update = req.body
  const set = {}
  Object.entries(update).forEach((entry) => {
    set[entry[0]] = entry[1]
  })
  try {
    const result = await db
      .collection('products')
      .updateOne({ _id }, { $set: set })
    console.log(result)
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function updateFamily(context: Context, req: HttpRequest) {
  const _id = new mongo.ObjectId(req.params.id)
  const { category, subcategory, name } = req.body
  const family = new ProductFamily({ category, subcategory, name })
  try {
    await db
      .collection('products.families')
      .replaceOne({ _id }, family, { safe: true, upsert: false })
    const updatedFamily = await db
      .collection('products.families')
      .findOne({ _id })
    context.res = {
      status: 200,
      body: updatedFamily
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function deleteFamily(context: Context, req: HttpRequest) {
  const family_id = req.params.id
  const _id = new mongo.ObjectID(family_id)
  try {
    await db.collection('products').deleteMany({ family_id })
    const result = await db.collection('products.families').deleteOne({ _id })
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

export async function deleteProduct(context: Context, req: HttpRequest) {
  const _id = new mongo.ObjectID(req.params.id)
  try {
    const result = await db.collection('products').deleteOne({ _id })
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

// Product Categories
export async function findCategories(context: Context, req: HttpRequest) {
  try {
    const result = await db
      .collection('products.families')
      .aggregate([
        { $group: { _id: '$category', name: { $first: '$category' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

// Product Subcategories
export async function findSubcategories(context: Context, req: HttpRequest) {
  const query = req.query || {}
  try {
    const result = await db
      .collection('products.families')
      .aggregate([
        { $match: query },
        { $group: { _id: '$subcategory', name: { $first: '$subcategory' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

// Product Names
export async function findNames(context: Context, req: HttpRequest) {
  const query = req.query || {}
  try {
    const result = await db
      .collection('products.families')
      .aggregate([
        { $match: query },
        { $group: { _id: '$name', name: { $first: '$name' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

// Product Colors
export async function findColors(context: Context, req: HttpRequest) {
  const query = req.query || {}
  try {
    const result = await db
      .collection('products')
      .aggregate([
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
          $addFields: {
            category: { $first: '$family.category' },
            subcategory: { $first: '$family.subcategory' },
            name: { $first: '$family.name' },
          },
        },
        { $match: query },
        { $group: { _id: '$color', name: { $first: '$color' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}

// Product Sizes
export async function findSizes(context: Context, req: HttpRequest) {
  const query = req.query || {}
  try {
    const result = await db
      .collection('products')
      .aggregate([
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
          $addFields: {
            category: { $first: '$family.category' },
            subcategory: { $first: '$family.subcategory' },
            name: { $first: '$family.name' },
          },
        },
        { $match: query },
        { $group: { _id: '$size', name: { $first: '$size' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    context.res = {
      status: 200,
      body: result
    }
  } catch (error) {
    errorHandler(error, context)
  }
}
