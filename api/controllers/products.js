const mongo = require('mongodb')
const database = require('../../database/utils')
const db = database.getDatabaseConnection()
const { Product, ProductFamily } = require('../models/products')

const errorHandler = (error, res) => {
  console.error(error)
  res.status(500).send(error)
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

// Products

const find = async function (req, res) {
  try {
    const query = req.query || {}
    console.log(query)
    const result = await db.collection('products').find(query).toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const findFamilies = async function (req, res) {
  try {
    const result = await db
      .collection('products.families')
      .find({})
      .sort({ category: 1 })
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const findFamily = async function (req, res) {
  try {
    const _id = new mongo.ObjectId(req.params.id)
    const result = await db.collection('products.families').findOne({ _id })
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const findAndGroupByCategories = async function (req, res) {
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
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const create = async function (req, res) {
  try {
    const product = new Product(req.body)
    const result = await db.collection('products').insertOne(product)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const createFamily = async function (req, res) {
  try {
    const { name, category, subcategory } = req.body
    const productFamily = new ProductFamily({ name, category, subcategory })
    await db.collection('products.families').insertOne(productFamily)
    const result = await db
      .collection('products.families')
      .findOne({ name: productFamily.name })
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const update = async function (req, res) {
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
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const updateFamily = async function (req, res) {
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
    res.status(200).send(updatedFamily)
  } catch (error) {
    errorHandler(error, res)
  }
}

const deleteFamily = async function (req, res) {
  const family_id = req.params.id
  const _id = new mongo.ObjectID(family_id)
  try {
    await db.collection('products').deleteMany({ family_id })
    const result = await db.collection('products.families').deleteOne({ _id })
    res.status(200).send(result)
  } catch (error) {
    console.error(error)
  }
}

const deleteProduct = async function (req, res) {
  const _id = new mongo.ObjectID(req.params.id)
  try {
    const result = await db.collection('products').deleteOne({ _id })
    res.status(200).send(result)
  } catch (error) {
    console.error(error)
  }
}

// Product Categories
const findCategories = async function (req, res) {
  try {
    const result = await db
      .collection('products.families')
      .aggregate([
        { $group: { _id: '$category', name: { $first: '$category' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Subcategories
const findSubcategories = async function (req, res) {
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
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Names
const findNames = async function (req, res) {
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
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Colors
const findColors = async function (req, res) {
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
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Sizes
const findSizes = async function (req, res) {
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
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

module.exports = {
  find,
  findFamilies,
  findFamily,
  findAndGroupByCategories,
  create,
  createFamily,
  update,
  deleteProduct,
  deleteFamily,
  findCategories,
  findSubcategories,
  findNames,
  findColors,
  findSizes,
  updateFamily,
}
