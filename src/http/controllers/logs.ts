import { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDatabaseConnection } from "../../database/utils"
import { MaterialChangeLog } from "../models/logs"
import { errorHandler } from "./utils/errors"

const db = getDatabaseConnection()

export async function findMaterialLogs(req: Request, res: Response) {
  try {
    const { material_id } = req.params
    const { page, per_page, sort_field, sort_order } = req.query
    console.log(sort_field, sort_order)

    const field = sort_field as string || 'updated_at'
    const order = sort_order === 'asc' ? -1 : 1
    const skip = (Number(page) - 1) * Number(per_page) || 0
    const limit = Number(per_page) || 20

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

export async function logMaterialPurchaseUpdate({
  purchase_number,
  warehouse_id,
  change_in_stock,
  material_id,
}: any) {
  const materialStockEntries = await db
    .collection('materials.stock')
    .find({ material_id })
    .toArray() as any

  const warehouse = materialStockEntries.find(
    (warehouse: any) => warehouse.warehouse_id === warehouse_id
  )
  const warehouse_stock = warehouse.stock
  const total_stock = materialStockEntries.reduce(
    (total: any, { stock }: { stock: any }) => total + stock,
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
  await db.collection('materials.history').insertOne(log)
}

export async function logMaterialStockUpdate({
  warehouse_id,
  change_in_stock,
  warehouse_stock,
  material_id,
}: any) {
  const materialStockEntries = await db
    .collection('materials.stock')
    .find({ material_id })
    .toArray() as any
  const total_stock = materialStockEntries.reduce(
    (total: any, { stock }: { stock: any }) => total + stock,
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
  await db.collection('materials.history').insertOne(log)
}

export async function logMaterialConsumption({
  material_id,
  change,
  warehouse_id,
  order_number,
  product_id,
  product_quantity,
}: any) {
  const { family_id } = await db
    .collection('products')
    .findOne({ _id: new ObjectId(product_id) }) as any
  const family = await db
    .collection('products.families')
    .findOne({ _id: new ObjectId(family_id) }) as any
  const materialStockEntries = await db
    .collection('materials.stock')
    .find({ material_id })
    .toArray()

  const total_stock = materialStockEntries.reduce(
    (total: any, { stock }: any) => total + stock,
    0
  )
  const warehouseEntry = materialStockEntries.find(
    (entry: any) => entry.warehouse_id === warehouse_id
  ) as any
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
  await db.collection('materials.history').insertOne(log)
}

