export function createMatchObjectFromQuery(query: any) {
  const mongoMatchObject = Object.entries(query).reduce(
    (mongoMatchObject, [key, value]: any) => {
      // Note: Value can be either a string or an Array
      let mongoMatchValue
      try {
        const parsedValue = JSON.parse(value)
        if (Array.isArray(parsedValue)) {
          mongoMatchValue = { $in: JSON.parse(value) }
        } else {
          mongoMatchValue = value
        }
      } catch (error) {
        mongoMatchValue = value
      }
      mongoMatchObject[key] = mongoMatchValue
      return mongoMatchObject
    },
    {} as any
  )
  return mongoMatchObject
}