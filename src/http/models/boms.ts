import { ObjectId } from "mongodb"

const mongo = require('mongodb')

export class BillOfMaterialEntry {
  _id: {
    product_id: ObjectId,
    material_id: ObjectId
  }
  product_id: ObjectId
  material_id: ObjectId
  quantity: number

  constructor({ product_id, material_id, quantity }: any) {
    this._id = {
      product_id: new mongo.ObjectID(product_id),
      material_id: new mongo.ObjectID(material_id),
    }
    this.product_id = product_id
    this.material_id = material_id
    this.quantity = quantity
  }
}

module.exports = { BillOfMaterialEntry }
