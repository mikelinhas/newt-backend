import { ObjectId } from "mongodb"

export class MaterialChangeLog {
  material_id: ObjectId
  change_in_stock: number
  total_stock: number
  warehouse_stock: number
  warehouse_id: ObjectId
  updated_at: Date
  updated_from: Date

  constructor({
    change_in_stock,
    total_stock,
    warehouse_stock,
    warehouse_id,
    updated_from,
    material_id,
  }: MaterialChangeLogCreateRequest) {
    this.material_id = material_id
    this.change_in_stock = change_in_stock
    this.total_stock = total_stock
    this.warehouse_stock = warehouse_stock
    this.warehouse_id = warehouse_id
    this.updated_at = new Date()
    this.updated_from = updated_from
  }
}

export interface MaterialChangeLogCreateRequest {
  change_in_stock: number
  total_stock: number
  warehouse_stock: number
  warehouse_id: ObjectId
  updated_from: any
  material_id: ObjectId
}

