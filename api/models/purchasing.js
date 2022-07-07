class Warehouse {
  constructor({ purchase_number, warehouse, supplier, materials }) {
    this.purchase_number = purchase_number
    this.warehouse_id = warehouse._id
    this.warehouse_name = warehouse.name
    this.supplier_id = supplier._id
    this.supplier_name = supplier.name
    this.materials = initializeMaterials(materials)
    this.date = new Date()
    this.closed = false // esto pa que?
    this.modified_at = [] // esto pa que?
  }
}

class PurchaseOrder {
  constructor({
    purchase_number,
    supplier_id,
    supplier_name,
    materials,
    total_price,
  }) {
    this.purchase_number = purchase_number
    this.supplier_id = supplier_id
    this.supplier_name = supplier_name
    this.materials = materials
    this.total_price = total_price
    this.created_at = new Date()
    this.closed = false
    this.modified_at = []
  }
}

function initializeMaterials(materials) {
  return materials.map((material) => {
    material.received = 0
    return material
  })
}

module.exports = { Warehouse, PurchaseOrder }
