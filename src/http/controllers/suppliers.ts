import { Request, Response } from "express"
import { getDatabaseConnection } from "../../database/utils"
import { Supplier } from "../models/suppliers"

const db = getDatabaseConnection()

export async function findSuppliers(req: Request, res: Response) {
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

export async function findSupplier(req: Request, res: Response) {
  try {
    const id = req.params.id
    const supplier = await db.collection('suppliers').findOne({ _id: id })
    res.status(200).send(supplier)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function findSupplierMaterials(req: Request, res: Response) {
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

export async function updateSupplier(req: Request, res: Response) {
  try {
    const id = req.params.id
    const supplier = new Supplier(req.body.supplier)
    // delete supplier._id
    const { result } = await db
      .collection('suppliers')
      .replaceOne({ _id: id }, supplier) as any
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function deleteSupplier(req: Request, res: Response) {
  try {
    const id = req.params.id
    const { result } = await db.collection('suppliers').deleteOne({ _id: id }) as any
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const supplier = new Supplier(req.body.supplier)
    await db.collection('suppliers').insertOne(supplier) as any
    res.status(200).send(supplier)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}
