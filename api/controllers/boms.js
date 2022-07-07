const mongo = require('mongodb')
const database = require('../../database/utils')
const db = database.getDatabaseConnection()
const { BillOfMaterialEntry } = require('./../models/boms')

const errorHandler = (error, res) => {
  console.error(error)
  res.status(500).send(error)
}

const findBOM = async function (req, res) {
  try {
    const product_id = new mongo.ObjectID(req.params.product_id)
    const result = await db
      .collection('materials.consumption')
      .find({ product_id })
      .toArray()
    if (!result) {
      res.status(400).send({ message: 'BOM does not exist' })
    } else {
      res.status(200).send(result)
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

const getBOMForTable = async function (req, res) {
  try {
    const { products } = req.query || {}
    let query = {}
    if (products) {
      query = { product_id: { $in: products } }
    }
    const result = await db
      .collection('materials.consumption')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'materials',
            let: { materialId: '$material_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [{ $toObjectId: '$$materialId' }, '$_id'] },
                },
              },
            ],
            as: 'material_info',
          },
        },
        {
          $lookup: {
            from: 'products',
            let: { productId: '$product_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toObjectId: '$$productId' }, '$_id'],
                  },
                  enabled: true,
                },
              },
            ],
            as: 'product_info',
          },
        },
        {
          $addFields: {
            name: { $arrayElemAt: ['$material_info.name', 0] },
            description: { $arrayElemAt: ['$material_info.description', 0] },
            measure_unit: { $arrayElemAt: ['$material_info.measure_unit', 0] },
            external_ref: { $arrayElemAt: ['$material_info.external_ref', 0] },
            supplier_id: { $arrayElemAt: ['$material_info.supplier_id', 0] },
            product_size: { $arrayElemAt: ['$product_info.size', 0] },
          },
        },
        {
          $group: {
            _id: '$material_id',
            products: {
              $addToSet: {
                product_size: '$product_size',
                product_id: '$product_id',
                material_quantity: '$quantity',
              },
            },
            name: { $first: '$name' },
            description: { $first: '$description' },
            measure_unit: { $first: '$measure_unit' },
            external_ref: { $first: '$external_ref' },
            supplier_id: { $first: '$supplier_id' },
          },
        },
        {
          $lookup: {
            from: 'suppliers',
            let: { supplierId: '$supplier_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$$supplierId', '$_id'] } } },
            ],
            as: 'supplier_info',
          },
        },
        {
          $addFields: {
            supplier_name: { $arrayElemAt: ['$supplier_info.name', 0] },
          },
        },
        {
          $project: {
            supplier_info: 0,
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

const updateBOM = async function (req, res) {
  try {
    const { material_id, quantity, upsert } = req.body
    const product_id = req.params.product_id

    const bomEntry = await db
      .collection('materials.consumption')
      .findOne({ product_id, material_id })

    if (bomEntry) {
      const { result } = await db
        .collection('materials.consumption')
        .updateOne(
          { product_id, material_id },
          { $set: { quantity } },
          { safe: true, upsert: false }
        )
      await handleUpdateResult(product_id, result, res)

    } else {
      const BOMEntry = new BillOfMaterialEntry({
        material_id,
        product_id,
        quantity,
      })
      const { result } = await db
        .collection('materials.consumption')
        .insertOne(BOMEntry)
      handleInsertResult(result, res)
    }

  } catch (error) {
    errorHandler(error, res)
  }
}

function handleInsertResult(result, res) {
  console.log(result)
  res.status(200).json()
}

async function handleUpdateResult(product_id, result, res) {
  if (result.nModified) {
    const bom = await db
      .collection('materials.consumption')
      .findOne({ product_id })
    res.status(200).json(bom)
  } else if (result.n) {
    const bom = await db
      .collection('materials.consumption')
      .findOne({ product_id })
    res.status(204).json(bom)
  } else {
    res.status(422).json({
      message: 'Did not find a bom entry for this product and material',
    })
  }
}

module.exports = {
  findBOM,
  getBOMForTable,
  updateBOM,
}
