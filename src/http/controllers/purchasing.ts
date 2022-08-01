import { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDatabaseConnection } from "../../database/utils"
import { WarehouseMaterial } from "../models/materials"
import { PurchaseOrder, Warehouse } from "../models/purchasing"
import { logMaterialPurchaseUpdate } from "./logs"
import { errorHandler } from "./utils/errors"

const db = getDatabaseConnection()

// Purchasing
export async function findOrders(req: Request, res: Response) {
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

export async function findOrder(req: Request, res: Response) {
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

export async function findOrderWarehouses(req: Request, res: Response) {
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

export async function updateOrder(req: Request, res: Response) {
  try {
    const update = req.body
    const id = new ObjectId(req.params.id)
    const { modifiedCount } = await db
      .collection('purchasing')
      .updateOne({ _id: id }, { $set: update }, { upsert: false }) as any
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
export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const { supplier_id, supplier_name, materials } = req.body.order
    const newPurchaseOrderNumber = await getNewPurchaseOrderNumber(
      supplier_id,
      supplier_name
    )
    const total_price = getTotalPrice(materials)
    const order = new PurchaseOrder({
      purchase_number: newPurchaseOrderNumber,
      supplier_id,
      supplier_name,
      materials,
      total_price,
    })
    await db.collection('purchasing').insertOne(order)

    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function getNewPurchaseOrderNumber(supplier_id, supplier_name: string) {
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

export async function createOrderWarehouseReceived(req: Request, res: Response) {
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
        .findOne({ purchase_number }) as any
      const producer = await db
        .collection('producers')
        .findOne({ _id: warehouse_id })
      const supplier = await db
        .collection('suppliers')
        .findOne({ _id: order.supplier_id })
      const newWarehouse = new Warehouse({
        purchase_number,
        warehouse: producer,
        supplier,
        materials: order.materials,
      })
      const { result } = await db
        .collection('purchasing.warehouses')
        .insertOne(newWarehouse) as any
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

export async function updateOrderWarehouseReceived(req: Request, res: Response) {
  try {
    const purchase_number = req.params.purchase_number
    const { warehouse_id, material_id, value } = req.body
    let order = await db.collection('purchasing').findOne({ purchase_number }) as any
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
    await logMaterialPurchaseUpdate({
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

export async function modifyWarehouseStock(
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
      { upsert: false }
    ) as any
    if (!result.ok) {
      throw new Error('Not modified correctly')
    }
  } else {
    const warehouseEntry = new WarehouseMaterial({
      warehouse_id,
      stock: change_in_stock,
      material_id,
    })
    await db.collection('materials.stock').insertOne(warehouseEntry)
  }
}

export async function updateOrderDeliveryDate(req: Request, res: Response) {
  try {
    const { date } = req.body
    const id = new ObjectId(req.params.id)
    await modifyOrderField(id, 'delivery_date', date)
    const order = await db.collection('purchasing').findOne({ _id: id })
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function updateOrderQuantity(req: Request, res: Response) {
  try {
    const { material_id, value } = req.body
    const id = new ObjectId(req.params.id)
    await modifyOrderMaterialsField(id, material_id, 'ordered', value)
    await modifyOrderDate(id)
    const order = await db.collection('purchasing').findOne({ _id: id }) as any
    const totalPrice = getTotalPrice(order.materials)
    await modifyOrderField(id, 'total_price', totalPrice)
    order.total_price = totalPrice
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function updateOrderPrice(req: Request, res: Response) {
  try {
    const { material_id, value } = req.body
    const id = new ObjectId(req.params.id)
    await modifyOrderMaterialsField(id, material_id, 'unit_price', value)
    await modifyOrderDate(id)
    const order = await db.collection('purchasing').findOne({ _id: id }) as any
    const totalPrice = getTotalPrice(order.materials)
    await modifyOrderField(id, 'total_price', totalPrice)
    order.total_price = totalPrice
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function getTotalReceived(purchase_number: any, material_id: any) {
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
}: any) {
  const warehouse = await db.collection('purchasing.warehouses').findOne(
    {
      purchase_number,
      warehouse_id,
    }
  ) as any
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
}: any) {
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
    { upsert: false }
  ) as any
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderMaterialsField(id: any, material_id: any, field: any, value: number) {
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
    { upsert: false }
  ) as any
  if (!result.ok) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderField(id: any, field: any, value: any) {
  const result = await db.collection('purchasing').updateOne(
    {
      _id: id,
    },
    { $set: { [field]: value } },
    { upsert: false }
  )
  if (!result.acknowledged) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderDate(id: any) {
  const result = await db.collection('purchasing').updateOne(
    {
      _id: id,
    },
    { $addToSet: { modified_at: new Date() } },
    { upsert: false }
  )
  if (!result.acknowledged) {
    throw new Error('Not modified correctly')
  }
}

function getTotalPrice(materials: any) {
  const totalPrice = materials.reduce((acc: number, material: any) => {
    return material.ordered * material.unit_price + acc
  }, 0)
  return totalPrice
}

export async function deleteOrder(req: Request, res: Response) {
  try {
    const id = new ObjectId(req.params.id)
    const { purchase_number } = await db
      .collection('purchasing')
      .findOne({ _id: id }) as any
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
