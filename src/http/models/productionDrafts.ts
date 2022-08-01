import { ObjectId } from "mongodb"

export class ProductionDraft {
  draft_number: string
  producer_id: ObjectId
  producer_name: string
  items: any // TODO: type this
  date: Date
  created_by: string
  modified_at: Date[]

  constructor({ draft_number, producer_id, producer_name, items, username }: any) {
    this.draft_number = draft_number
    this.producer_id = producer_id
    this.producer_name = producer_name
    this.items = normalizeItems(items)
    this.date = new Date()
    this.created_by = username
    this.modified_at = []
  }
}

function normalizeItems(items: any) {
  const modifiedItems = items.map((item: any) => {
    item.new_ordered = 0
    item.product_id = String(item._id)
    delete item._id
    return item
  })
  return modifiedItems
}

