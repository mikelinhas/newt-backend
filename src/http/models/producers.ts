import { ObjectId } from "mongodb"

export class Producer {
  _id: ObjectId
  name: string
  CIF: string
  description: string
  email: string
  phone: string
  product_categories: string[]

  constructor(producer: any) {
    this._id = producer.CIF
    this.name = producer.name
    this.CIF = producer.CIF
    this.description = producer.description
    this.email = producer.email
    this.phone = producer.phone
    this.product_categories = producer.product_categories
  }
}

