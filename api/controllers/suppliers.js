const database = require('../../database/utils')
const db = database.getDatabaseConnection()
const models = require('../models/suppliers')

const findSuppliers = async function (req, res) {
  try {
    const result = await db
      .collection('suppliers')
      .find()
      .sort({ name: 1 })
      .toArray()
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const findSupplier = async function (req, res) {
  try {
    const id = req.params.id
    const supplier = await db.collection('suppliers').findOne({ _id: id })
    res.status(200).send(supplier)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const findSupplierMaterials = async function (req, res) {
  try {
    const supplier_id = req.params.id
    const result = await db
      .collection('materials')
      .aggregate([
        { $match: { supplier_id } },
        {
          $lookup: {
            from: 'purchasing',
            let: { materialId: '$_id' },
            pipeline: [
              { $match: { closed: 0 } },
              { $unwind: '$materials' },
              {
                $match: {
                  $expr: {
                    $eq: [
                      { $toObjectId: '$materials.material_id' },
                      '$$materialId',
                    ],
                  },
                },
              },
              {
                $addFields: {
                  ordered: '$materials.ordered',
                  received: '$materials.received',
                },
              },
              { $project: { purchase_number: 1, ordered: 1, received: 1 } },
            ],
            as: 'orders',
          },
        },
        {
          $lookup: {
            from: 'materials.stock',
            let: { materialId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toObjectId: '$material_id' }, '$$materialId'],
                  },
                },
              },
              { $project: { stock: 1, warehouse_id: 1 } },
            ],
            as: 'stock',
          },
        },
      ])
      .toArray()
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const updateSupplier = async function (req, res) {
  try {
    const id = req.params.id
    const supplier = new models.Supplier(req.body.supplier)
    delete supplier._id
    console.log(supplier)
    const { result } = await db
      .collection('suppliers')
      .replaceOne({ _id: id }, supplier)
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const deleteSupplier = async function (req, res) {
  try {
    const id = req.params.id
    const { result } = await db.collection('suppliers').deleteOne({ _id: id })
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const createSupplier = async function (req, res) {
  try {
    const supplier = new models.Supplier(req.body.supplier)
    const { result } = await db.collection('suppliers').insertOne(supplier)
    console.log(result)
    res.status(200).send(supplier)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

module.exports = {
  findSuppliers,
  findSupplier,
  findSupplierMaterials,
  createSupplier,
  updateSupplier,
  deleteSupplier,
}
