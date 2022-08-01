import { ObjectId } from "mongodb"

export class Material {
  _id?: ObjectId
  name: string
  description: string
  measure_unit: string
  unit_price: number
  external_ref: string
  supplier_id: any

  constructor({
    name,
    description,
    measure_unit,
    unit_price,
    external_ref,
    supplier_id,
  }: any) {
    this.name = name
    this.description = description
    this.measure_unit = measure_unit.toLowerCase()
    this.unit_price = Number(unit_price)
    this.external_ref = external_ref
    this.supplier_id = supplier_id
  }
}

export class WarehouseMaterial {
  material_id: any
  warehouse_id: any
  stock: number

  constructor({ material_id, warehouse_id, stock }: any) {
    this.material_id = material_id
    this.warehouse_id = warehouse_id
    this.stock = Number(stock)
  }
}

module.exports = { Material, WarehouseMaterial }
