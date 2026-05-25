export const getEditableStorageFileUrl = (
  postId: number,
  fileId: number | null | undefined
) => {
  if (!fileId) {
    return undefined
  }

  return `/api/storage/${postId}/files/${fileId}/editable`
}
