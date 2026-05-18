import { StorageFile } from "./storage.type"

export type UploadPostFileResponse = Omit<StorageFile, "createAt" | "updateAt">
