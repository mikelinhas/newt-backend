class MaterialChangeLog {
  constructor({
    change_in_stock,
    total_stock,
    warehouse_stock,
    warehouse_id,
    updated_from,
    material_id,
  }) {
    this.material_id = material_id
    this.change_in_stock = change_in_stock
    this.total_stock = total_stock
    this.warehouse_stock = warehouse_stock
    this.warehouse_id = warehouse_id
    this.updated_at = new Date()
    this.updated_from = updated_from
  }
}

module.exports = { MaterialChangeLog }
