class Material {
  constructor({
    name,
    description,
    measure_unit,
    unit_price,
    external_ref,
    supplier_id,
  }) {
    this.name = name
    this.description = description
    this.measure_unit = measure_unit.toLowerCase()
    this.unit_price = Number(unit_price)
    this.external_ref = external_ref
    this.supplier_id = supplier_id
  }
}

class WarehouseMaterial {
  constructor({ material_id, warehouse_id, stock }) {
    this.material_id = material_id
    this.warehouse_id = warehouse_id
    this.stock = Number(stock)
  }
}

module.exports = { Material, WarehouseMaterial }
