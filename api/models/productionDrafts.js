class ProductionDraft {
  constructor({ draft_number, producer_id, producer_name, items, username }) {
    this.draft_number = draft_number
    this.producer_id = producer_id
    this.producer_name = producer_name
    this.items = normalizeItems(items)
    this.date = new Date()
    this.created_by = username
    this.modified_at = []
  }
}

function normalizeItems(items) {
  const modifiedItems = items.map((item) => {
    item.new_ordered = 0
    item.product_id = String(item._id)
    delete item._id
    return item
  })
  return modifiedItems
}

module.exports = { ProductionDraft }
