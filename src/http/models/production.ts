import { ObjectId } from "mongodb"

export class ProductionOrder {
  order_number: string
  producer_id: ObjectId
  producer_name: string
  items: ProductionOrderItem[]
  date: Date
  modified_at: Date[]
  closed: boolean

  constructor({ order_number, producer_id, producer_name, items }: any) {
    this.order_number = order_number
    this.producer_id = producer_id
    this.producer_name = producer_name
    this.items = normalizeItems(items)
    this.date = new Date()
    this.closed = false
    this.modified_at = []
  }
}

export class ProductionOrderItem {
  category: string
  color: string
  size: string
  name: string
  ordered: number
  finished: number
  product_id: ObjectId

  constructor({ category, color, name, size, new_ordered, product_id }: any) {
    this.category = category
    this.color = color
    this.size = size
    this.name = name
    this.ordered = new_ordered
    this.finished = 0
    this.product_id = product_id
  }
}

function normalizeItems(items: any): ProductionOrderItem[] {
  const modifiedItems = items.map((item: any) => {
    return new ProductionOrderItem(item)
  })
  return modifiedItems
}
