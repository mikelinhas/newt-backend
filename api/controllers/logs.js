const mongo = require('mongodb')
const database = require('../../database/utils')
const db = database.getDatabaseConnection()
const { MaterialChangeLog } = require('../models/logs')

const errorHandler = (error, res) => {
  console.error(error)
  res.status(500).send(error)
}

const findMaterialLogs = async function (req, res) {
  try {
    const { material_id } = req.params
    const { page, per_page, sort_field, sort_order } = req.query
    console.log(sort_field, sort_order)

    const field = sort_field || 'updated_at'
    const order = sort_order === 'asc' ? -1 : 1
    const skip = (page - 1) * per_page || 0
    const limit = parseInt(per_page) || 20

    const total = await db
      .collection('materials.history')
      .countDocuments({ material_id })
    const logs = await db
      .collection('materials.history')
      .find({ material_id })
      .sort({ [field]: order })
      .skip(skip)
      .limit(limit)
      .toArray()
    res.status(200).send({ total, logs })
  } catch (error) {
    errorHandler(error, res)
  }
}

const logMaterialPurchaseUpdate = async function ({
  purchase_number,
  warehouse_id,
  change_in_stock,
  material_id,
}) {
  const materialStockEntries = await db
    .collection('materials.stock')
    .find({ material_id })
    .toArray()
  console.log(materialStockEntries)
  const warehouse = materialStockEntries.find(
    (warehouse) => warehouse.warehouse_id === warehouse_id
  )
  const warehouse_stock = warehouse.stock
  const total_stock = materialStockEntries.reduce(
    (total, { stock }) => total + stock,
    0
  )
  const updated_from = {
    label: 'Compras',
    purchase_number,
  }
  const log = new MaterialChangeLog({
    material_id,
    change_in_stock,
    total_stock,
    warehouse_stock,
    warehouse_id,
    updated_from,
  })
  await db.collection('materials.history').insert(log)
}

const logMaterialStockUpdate = async function ({
  warehouse_id,
  change_in_stock,
  warehouse_stock,
  material_id,
}) {
  const materialStockEntries = await db
    .collection('materials.stock')
    .find({ material_id })
    .toArray()
  const total_stock = materialStockEntries.reduce(
    (total, { stock }) => total + stock,
    0
  )
  const updated_from = {
    label: 'Cambio Manual',
  }
  const log = new MaterialChangeLog({
    material_id,
    change_in_stock,
    total_stock,
    warehouse_stock,
    warehouse_id,
    updated_from,
  })
  await db.collection('materials.history').insert(log)
}

const logMaterialConsumption = async function ({
  material_id,
  change,
  warehouse_id,
  order_number,
  product_id,
  product_quantity,
}) {
  const { family_id } = await db
    .collection('products')
    .findOne({ _id: new mongo.ObjectId(product_id) })
  const family = await db
    .collection('products.families')
    .findOne({ _id: new mongo.ObjectId(family_id) })
  const materialStockEntries = await db
    .collection('materials.stock')
    .find({ material_id })
    .toArray()
  const total_stock = materialStockEntries.reduce(
    (total, { stock }) => total + stock,
    0
  )
  const warehouseEntry = materialStockEntries.find(
    (entry) => entry.warehouse_id === warehouse_id
  )
  const warehouse_stock = warehouseEntry.stock
  const updated_from = {
    label: 'Producción',
    order_number,
    product_id,
    product_quantity,
    product_name: family.name,
  }
  const log = new MaterialChangeLog({
    material_id,
    change_in_stock: change,
    total_stock,
    warehouse_stock,
    warehouse_id,
    updated_from,
  })
  await db.collection('materials.history').insert(log)
}

module.exports = {
  findMaterialLogs,
  logMaterialConsumption,
  logMaterialPurchaseUpdate,
  logMaterialStockUpdate,
}
