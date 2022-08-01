export interface DeletionResult {
  collection: string;
  totalDeleted: number;
  relatedDocuments?: DeletionResult[];
}

export enum SaveAction {
  Created = "Created",
  Updated = "Updated",
  NotModified = "Not Modified",
}

// TODO: change updatedObject to savedObject
export interface SaveResult<T> {
  action: SaveAction;
  savedObject: T;
}
