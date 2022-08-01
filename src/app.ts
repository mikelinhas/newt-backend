import "dotenv/config"
import { Db } from "mongodb"
import { connectToDatabase } from "./database/utils"
import { ProductFamilyService } from "./domains/productfamilies/service"
import { ProductService } from "./domains/products/service"
import { startHttpApi } from "./http/http"

async function start() {
  const db = await connectToDatabase()

  console.log('🌱  Connected to MongoDB! Yay!\n')

  const services = new HttpServices(db)
  startHttpApi(services)

}

start()

export class HttpServices {
  productFamilyService: ProductFamilyService
  productService: ProductService

  constructor(db: Db) {
    this.productService = new ProductService(db)
    this.productFamilyService = new ProductFamilyService(db)
  }

}