const mongo = require('mongodb')
const models = require('../models/purchasing')
const { WarehouseMaterial } = require('../models/materials')
const database = require('./../../database/utils')
const db = database.getDatabaseConnection()
const logs = require('./logs')
const errorHandler = (error, res) => {
  console.error(error)
  res.status(500).send(error)
}

// Purchasing

const findOrders = async function (req, res) {
  try {
    const result = await db
      .collection('purchasing')
      .find()
      .sort({ created_at: -1 })
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const findOrder = async function (req, res) {
  try {
    const orderNumber = req.params.purchase_number
    const result = await db
      .collection('purchasing')
      .findOne({ purchase_number: orderNumber })
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const findOrderWarehouses = async function (req, res) {
  try {
    const orderNumber = req.params.purchase_number
    const result = await db
      .collection('purchasing.warehouses')
      .find({ purchase_number: orderNumber })
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

const updateOrder = async (req, res) => {
  try {
    const update = req.body
    const id = new mongo.ObjectID(req.params.id)
    const { modifiedCount } = await db
      .collection('purchasing')
      .updateOne({ _id: id }, { $set: update }, { safe: true, upsert: false })
    if (modifiedCount) {
      const order = await db.collection('purchasing').findOne({ _id: id })
      res.status(200).send(order)
    } else {
      throw new Error('Not modified correctly')
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier_id, supplier_name, materials } = req.body.order
    const newPurchaseOrderNumber = await getNewPurchaseOrderNumber(
      supplier_id,
      supplier_name
    )
    const total_price = getTotalPrice(materials)
    const order = new models.PurchaseOrder({
      purchase_number: newPurchaseOrderNumber,
      supplier_id,
      supplier_name,
      materials,
      total_price,
    })
    await db.collection('purchasing').insert(order)
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function getNewPurchaseOrderNumber(supplier_id, supplier_name) {
  const supplierInitials = supplier_name.substring(0, 3).toUpperCase()
  const orders = await db
    .collection('purchasing')
    .find({ supplier_id })
    .toArray()
  const highest = orders.reduce((highest, order) => {
    const orderNumber = order.purchase_number
    const number = Number(orderNumber.substr(orderNumber.length - 4))
    if (number > highest) {
      return number
    } else {
      return highest
    }
  }, 0)
  console.log(highest)
  const newHighest = highest + 1
  const num = '000' + newHighest
  const paddedNumber = num.substr(num.length - 4)
  const newOrderNumber = supplierInitials + '-' + paddedNumber
  return newOrderNumber
}

const createOrderWarehouseReceived = async function (req, res) {
  try {
    const purchase_number = req.params.purchase_number
    const { warehouse_id } = req.body
    const warehouse = await db
      .collection('purchasing.warehouses')
      .findOne({ purchase_number, warehouse_id })
    if (warehouse) {
      throw new Error('Este ya existe, no deberia aparecer en el frontend.')
    } else {
      const order = await db
        .collection('purchasing')
        .findOne({ purchase_number })
      const producer = await db
        .collection('producers')
        .findOne({ _id: warehouse_id })
      const supplier = await db
        .collection('suppliers')
        .findOne({ _id: order.supplier_id })
      const newWarehouse = new models.Warehouse({
        purchase_number,
        warehouse: producer,
        supplier,
        materials: order.materials,
      })
      const { result } = await db
        .collection('purchasing.warehouses')
        .insertOne(newWarehouse)
      if (result.n !== 1) {
        throw new Error('Algo ha ido mal y no se ha añadido.')
      } else {
        res.status(200).send(newWarehouse)
      }
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

const updateOrderWarehouseReceived = async function (req, res) {
  try {
    const purchase_number = req.params.purchase_number
    const { warehouse_id, material_id, value } = req.body
    let order = await db.collection('purchasing').findOne({ purchase_number })
    const currentReceived = await getCurrentReceivedValue({
      purchase_number,
      warehouse_id,
      material_id,
    })
    const change_in_stock = value - currentReceived
    await modifyWarehouseReceived({
      purchase_number,
      warehouse_id,
      material_id,
      value,
    })
    const total_received = await getTotalReceived(purchase_number, material_id)
    await modifyOrderMaterialsField(
      order._id,
      material_id,
      'received',
      total_received
    )
    await modifyWarehouseStock(warehouse_id, material_id, change_in_stock)
    await logs.logMaterialPurchaseUpdate({
      purchase_number,
      warehouse_id,
      change_in_stock,
      material_id,
    })
    order = await db.collection('purchasing').findOne({ purchase_number })
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

const modifyWarehouseStock = async function (
  warehouse_id,
  material_id,
  change_in_stock
) {
  const warehouse = await db
    .collection('materials.stock')
    .findOne({ material_id, warehouse_id })
  if (warehouse) {
    const { result } = await db.collection('materials.stock').updateOne(
      {
        material_id,
        warehouse_id,
      },
      { $inc: { stock: change_in_stock } },
      { safe: true, upsert: false }
    )
    if (!result.ok) {
      throw new Error('Not modified correctly')
    }
  } else {
    const warehouseEntry = new WarehouseMaterial({
      warehouse_id,
      stock: change_in_stock,
      material_id,
    })
    await db.collection('materials.stock').insert(warehouseEntry)
  }
}

const updateOrderDeliveryDate = async (req, res) => {
  try {
    const { date } = req.body
    const id = new mongo.ObjectID(req.params.id)
    await modifyOrderField(id, 'delivery_date', date)
    const order = await db.collection('purchasing').findOne({ _id: id })
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

const updateOrderQuantity = async (req, res) => {
  try {
    const { material_id, value } = req.body
    const id = new mongo.ObjectID(req.params.id)
    await modifyOrderMaterialsField(id, material_id, 'ordered', value)
    await modifyOrderDate(id)
    const order = await db.collection('purchasing').findOne({ _id: id })
    const totalPrice = getTotalPrice(order.materials)
    await modifyOrderField(id, 'total_price', totalPrice)
    order.total_price = totalPrice
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

const updateOrderPrice = async (req, res) => {
  try {
    const { material_id, value } = req.body
    const id = new mongo.ObjectID(req.params.id)
    await modifyOrderMaterialsField(id, material_id, 'unit_price', value)
    await modifyOrderDate(id)
    const order = await db.collection('purchasing').findOne({ _id: id })
    const totalPrice = getTotalPrice(order.materials)
    await modifyOrderField(id, 'total_price', totalPrice)
    order.total_price = totalPrice
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function getTotalReceived(purchase_number, material_id) {
  const result = await db
    .collection('purchasing.warehouses')
    .aggregate([
      { $match: { purchase_number } },
      { $project: { materials: 1 } },
      { $unwind: '$materials' },
      {
        $addFields: {
          material_id: '$materials.material_id',
          received: '$materials.received',
        },
      },
      { $match: { material_id } },
      { $project: { material_id: 1, received: 1 } },
      {
        $group: {
          _id: { material_id: '$material_id' },
          total_received: { $sum: '$received' },
        },
      },
    ])
    .toArray()
  const { total_received } = result[0]
  return total_received
}

async function getCurrentReceivedValue({
  purchase_number,
  warehouse_id,
  material_id,
}) {
  const warehouse = await db.collection('purchasing.warehouses').findOne(
    {
      purchase_number,
      warehouse_id,
    },
    { safe: true, upsert: false }
  )
  const material = warehouse.materials.find(
    (material) => material.material_id === material_id
  )
  return material.received
}

async function modifyWarehouseReceived({
  purchase_number,
  warehouse_id,
  material_id,
  value,
}) {
  const { result } = await db.collection('purchasing.warehouses').updateOne(
    {
      purchase_number,
      warehouse_id,
      materials: {
        $elemMatch: {
          material_id,
        },
      },
    },
    { $set: { 'materials.$.received': value } },
    { safe: true, upsert: false }
  )
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderMaterialsField(id, material_id, field, value) {
  const fieldToModify = 'materials.$.' + field
  const { result } = await db.collection('purchasing').updateOne(
    {
      _id: id,
      materials: {
        $elemMatch: {
          material_id,
        },
      },
    },
    { $set: { [fieldToModify]: value } },
    { safe: true, upsert: false }
  )
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderField(id, field, value) {
  const { result } = await db.collection('purchasing').updateOne(
    {
      _id: id,
    },
    { $set: { [field]: value } },
    { safe: true, upsert: false }
  )
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderDate(id) {
  const { result } = await db.collection('purchasing').updateOne(
    {
      _id: id,
    },
    { $addToSet: { modified_at: new Date() } },
    { safe: true, upsert: false }
  )
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

function getTotalPrice(materials) {
  const totalPrice = materials.reduce((acc, material) => {
    return material.ordered * material.unit_price + acc
  }, 0)
  return totalPrice
}

const deleteOrder = async (req, res) => {
  try {
    const id = new mongo.ObjectID(req.params.id)
    const { purchase_number } = await db
      .collection('purchasing')
      .findOne({ _id: id })
    const { deletedCount } = await db
      .collection('purchasing')
      .deleteOne({ _id: id })
    await db.collection('purchasing.warehouses').deleteMany({ purchase_number })
    if (deletedCount) {
      res.status(200).send({ deletedCount })
    } else {
      throw new Error('Not deleted correctly')
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

module.exports = {
  findOrders,
  findOrder,
  findOrderWarehouses,
  updateOrder,
  createPurchaseOrder,
  createOrderWarehouseReceived,
  updateOrderWarehouseReceived,
  updateOrderDeliveryDate,
  deleteOrder,
  updateOrderQuantity,
  updateOrderPrice,
}
