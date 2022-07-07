const mongo = require('mongodb')

class BillOfMaterialEntry {
  constructor({ product_id, material_id, quantity }) {
    this._id = {
      product_id: new mongo.ObjectID(product_id),
      material_id: new mongo.ObjectID(material_id),
    }
    this.product_id = String(product_id)
    this.material_id = String(material_id)
    this.quantity = quantity
  }
}

module.exports = { BillOfMaterialEntry }
