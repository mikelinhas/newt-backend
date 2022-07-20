import { Context, HttpRequest } from "@azure/functions";


export interface MiddlewareFunction {
  (context: Context, req: HttpRequest, next?: NextFuction): Promise<void>
}

export interface NextFuction {
  (error?: any): Promise<void>
}

export class MiddlewareHandler {
  context: Context
  req: HttpRequest
  pipeline: MiddlewareFunction[]
  currentPipelineCursor: number;

  constructor(context: Context, req: HttpRequest) {
    this.pipeline = [];
    this.context = context;
    this.req = req
    this.currentPipelineCursor = 0;
  }

  /**
   * Adds a middleware to current middleware cascade.
   * @param {MiddlewareFunction} fn Function to be executed as middleware
   */
  use(...middlewares: MiddlewareFunction[]) {
    middlewares.forEach(middleware => this.pipeline.push(middleware))
  }

  async runNextMiddleware(error?: any) {
    try {
      if (error) {
        this.context.res = {
          status: 500,
          body: error
        }
      } else {
        this.currentPipelineCursor += 1;
        const middleware = this.pipeline[this.currentPipelineCursor];
        await middleware(this.context, this.req, this.runNextMiddleware.bind(this))
      }
    } catch (error) {
      this.context.res = {
        status: 500,
        body: error
      }
    }
  }

  /**
   * Returns the Azure Function entry point and process the full pipeline.
   */
  async run(): Promise<void> {
    const middleware = this.pipeline[this.currentPipelineCursor];
    await middleware(this.context, this.req, this.runNextMiddleware.bind(this))
  }
}

export function notFound(context: Context) {
  context.res = {
    status: 404,
    body: "This endpoint does not exist"
  }
}

export function errorHandler(error, context: Context) {
  errorHandler(error, context)
  context.res = {
    status: 500,
    body: error
  }
}
