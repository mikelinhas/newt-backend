import { ObjectId } from "mongodb"

export class Supplier {
  _id?: ObjectId
  name: string
  CIF: string
  description: string
  email: string
  phone: string
  tags: string[]

  constructor(supplier: any) {
    this.name = supplier.name
    this.CIF = supplier.CIF
    this.description = supplier.description
    this.email = supplier.email
    this.phone = supplier.phone
    this.tags = supplier.tags
  }
}
