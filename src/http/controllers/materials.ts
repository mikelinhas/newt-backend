import { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDatabaseConnection } from "../../database/utils"
import { Material, WarehouseMaterial } from "../models/materials"
import { logMaterialStockUpdate } from "./logs"
import { errorHandler } from "./utils/errors"

const db = getDatabaseConnection()

export async function findMaterials(req: Request, res: Response) {
  try {
    const query = req.query || {}
    const result = await db
      .collection('materials')
      .aggregate([
        { $match: query },
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
            ],
            as: 'stock',
          },
        },
      ])
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function createMaterial(req: Request, res: Response) {
  try {
    const material = new Material(req.body)
    const { insertedId } = await db.collection('materials').insertOne(material)
    const createdMaterial = await db
      .collection('materials')
      .findOne({ _id: insertedId })
    res.status(200).send(createdMaterial)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function updateMaterial(req: Request, res: Response) {
  try {
    const _id = new ObjectId(req.params.id)
    const material = new Material(req.body)
    delete material._id
    const { result } = await db
      .collection('materials')
      .replaceOne({ _id }, material) as any
    material._id = _id
    if (result.nModified) {
      res.status(200).send(material)
    } else if (result.n && !result.nModified) {
      res.status(204).send(material)
    } else {
      res.status(400).send(result)
    }
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function deleteMaterial(req: Request, res: Response) {
  try {
    const _id = new ObjectId(req.params.id)
    const { result } = await db.collection('materials').deleteOne({ _id }) as any
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function findMaterial(req: Request, res: Response) {
  try {
    const material_id = req.params.id
    const _id = new ObjectId(material_id)
    const material = await db.collection('materials').findOne({ _id }) as any
    const supplier = await db
      .collection('suppliers')
      .findOne({ _id: material.supplier_id }) as any
    const stock = await db
      .collection('materials.stock')
      .aggregate([
        { $match: { material_id } },
        {
          $lookup: {
            from: 'producers',
            let: { warehouseId: '$warehouse_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$$warehouseId', '$_id'],
                  },
                },
              },
            ],
            as: 'warehouse_info',
          },
        },
        {
          $project: {
            _id: 0,
            material_id: 1,
            stock: 1,
            warehouse_id: 1,
            warehouse_name: { $first: '$warehouse_info.name' },
          },
        },
      ])
      .toArray()
    res.status(200).send({ ...material, stock, supplier_name: supplier.name })
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function findMeasureUnits(req: Request, res: Response) {
  try {
    const result = await db
      .collection('materials')
      .aggregate([
        { $group: { _id: '$measure_unit', name: { $first: '$measure_unit' } } },
        { $project: { _id: 0 } },
        { $sort: { name: 1 } },
      ])
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

function removeExtraProductionEntry(materials: any) {
  const cleanArray = materials.map((material: any) => {
    material.in_production = material.in_production.filter(
      ({ quantity }: any) => quantity > 0
    )
    return material
  })
  return cleanArray
}

export async function findStock(req: Request, res: Response) {
  try {
    const { warehouse_id, supplier_id } = req.query || {}
    let result = []
    if (warehouse_id) {
      const materials = await getWarehouseStock(warehouse_id)
      result = removeExtraProductionEntry(materials)
    } else {
      result = await getSupplierStock(supplier_id) as any
    }
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function createWarehouseEntry(req: Request, res: Response) {
  try {
    const { warehouse_id, stock } = req.body
    const material_id = req.params.id
    await db.collection('producers').findOne({ _id: warehouse_id })
    const warehouseEntry = new WarehouseMaterial({
      warehouse_id,
      stock,
      material_id,
    })
    const existingEntry = await db
      .collection('materials.stock')
      .findOne({ warehouse_id, material_id })
    if (existingEntry) {
      console.log(existingEntry)
      res.status(409).json({ message: 'Warehouse entry already exists' })
    } else {
      await db.collection('materials.stock').insertOne(warehouseEntry)
      await logMaterialStockUpdate({
        warehouse_id,
        change_in_stock: stock,
        warehouse_stock: stock,
        material_id,
      })
      res.status(201).json(warehouseEntry)
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

// TODO: que peligro
export async function updateWarehouseEntry(req: Request, res: Response) {
  try {
    const { warehouse_id, stock } = req.body
    const material_id = req.params.id
    const warehouseEntry = await db
      .collection('materials.stock')
      .findOne({ warehouse_id, material_id }) as any
    const result = await db
      .collection('materials.stock')
      .updateOne(
        { warehouse_id, material_id },
        { $set: { stock: Number(stock) } },
        { upsert: false }
      )
    if (result.modifiedCount) {
      const previous_stock = warehouseEntry.stock
      const change_in_stock = stock - previous_stock
      await logMaterialStockUpdate({
        warehouse_id,
        change_in_stock,
        warehouse_stock: stock,
        material_id,
      })
      warehouseEntry.stock = stock
      res.status(200).json(warehouseEntry)
    } else if (result.modifiedCount) {
      res.status(204).json(warehouseEntry)
    } else {
      res
        .status(422)
        .json({ message: 'Did not find a warehouse entry for this material' })
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function getWarehouseStock(warehouse_id: any) {
  const result = await db
    .collection('materials.stock')
    .aggregate([
      { $match: { warehouse_id } },
      {
        $lookup: {
          from: 'materials.consumption',
          let: { materialId: '$material_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$material_id', '$$materialId'],
                },
              },
            },
          ],
          as: 'existing_boms',
        },
      },
      {
        $addFields: {
          boms: { $concatArrays: ['$existing_boms', ['no_bom']] },
        },
      },
      { $unwind: '$boms' },
      {
        $addFields: {
          product_id: '$boms.product_id',
          quantity: '$boms.quantity',
        },
      },
      { $project: { boms: 0, existing_boms: 0 } },
      {
        $lookup: {
          from: 'production',
          let: { productId: '$product_id' },
          pipeline: [
            { $match: { closed: false, producer_id: warehouse_id } },
            {
              $project: {
                items: 1,
                producer_id: 1,
                producer_name: 1,
                order_number: 1,
              },
            },
            { $unwind: '$items' },
            {
              $match: { $expr: { $eq: ['$items.product_id', '$$productId'] } },
            },
          ],
          as: 'existing_productions',
        },
      },
      {
        $addFields: {
          production: {
            $concatArrays: ['$existing_productions', ['no_production']],
          },
        },
      },
      { $project: { existing_productions: 0 } },
      { $unwind: '$production' },
      {
        $addFields: {
          in_production_order: '$production.order_number',
          in_production: {
            $cond: [
              { $eq: ['$production', 'no_production'] },
              0,
              {
                $multiply: [
                  {
                    $subtract: [
                      { $sum: '$production.items.ordered' },
                      { $sum: '$production.items.finished' },
                    ],
                  },
                  '$quantity',
                ],
              },
            ],
          },
        },
      },
      { $project: { production: 0, existing_productions: 0, quantity: 0 } },
      {
        $group: {
          _id: {
            material_id: '$material_id',
            in_production_order: '$in_production_order',
          },
          in_production: { $sum: '$in_production' },
          in_production_order: { $first: '$in_production_order' },
          warehouse_id: { $first: '$warehouse_id' },
          stock: { $first: '$stock' },
          material_id: { $first: '$material_id' },
        },
      },
      {
        $group: {
          _id: '$material_id',
          stock: { $first: '$stock' },
          warehouse_id: { $first: '$warehouse_id' },
          in_production: {
            $push: {
              quantity: '$in_production',
              production_order: '$in_production_order',
            },
          },
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
                  $eq: [{ $toObjectId: '$$materialId' }, '$_id'],
                },
              },
            },
          ],
          as: 'material_info',
        },
      },
      {
        $project: {
          _id: { $toObjectId: '$_id' },
          name: { $first: '$material_info.name' },
          description: { $first: '$material_info.description' },
          external_ref: { $first: '$material_info.external_ref' },
          unit_price: { $first: '$material_info.unit_price' },
          measure_unit: { $first: '$material_info.measure_unit' },
          stock: 1,
          warehouse_id: 1,
          in_production: 1,
        },
      },
    ])
    .toArray()
  return result
}

export async function getSupplierStock(supplier_id: any) {
  const result = await db
    .collection('materials')
    .aggregate([
      { $match: { supplier_id } },
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
          ],
          as: 'warehouse_stock',
        },
      },
      {
        $addFields: {
          total_stock: { $sum: '$warehouse_stock.stock' },
        },
      },
    ])
    .toArray()
  return result
}