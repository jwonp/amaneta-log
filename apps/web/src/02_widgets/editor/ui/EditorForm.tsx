import { FieldGroup } from "@workspace/ui/components/field"
import { Button } from "@packages/ui/src/components/button"

import EditorMarkdownField from "@/src/04_entities/editor/ui/fields/EditorMarkdownField"
import EditorThumbnailField from "@/src/04_entities/editor/ui/fields/EditorThumbnailField"

import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"

import EditorTagField from "@/src/04_entities/editor/ui/fields/EditorTagField"
import EditorVisibilityField from "@/src/04_entities/editor/ui/fields/EditorVisibilityField"
import EditorDescriptionField from "@/src/04_entities/editor/ui/fields/EditorDescriptionField"
import EditorTitleField from "@/src/04_entities/editor/ui/fields/EditorTitleField"
import { IconPhoto, IconVideo } from "@tabler/icons-react"
import { StorageFile } from "@/src/05_shared/api/storage/model/storage.type"
import { Post } from "@/src/05_shared/api/post/model/post.type"
import { STORAGE_FILE_USAGE } from "@/src/05_shared/api/storage/model/storage.const"
import EditorSaveAsDraftButton from "@/src/04_entities/editor/ui/button/EditorSaveAsDraftButton"
import EditorSaveButton from "@/src/04_entities/editor/ui/button/EditorSaveButton"
interface EditorFormProps {
  post: Post
  files: StorageFile[]
}
const EditorForm = ({ post, files }: EditorFormProps) => {
  const thumbnail = files.find((f) => f.usage === STORAGE_FILE_USAGE.THUMBNAIL)
  const thumbnailSrc = thumbnail
    ? `/api/posts/${post.id}/${files}/${thumbnail.id}`
    : undefined

  return (
    <form className="w-full max-w-full min-w-0 overflow-x-clip">
      <div className="mb-16 w-full max-w-full min-w-0">
        <EditorTitleField initTitle={post.title} />
        <EditorMarkdownField initMarkdown={post.markdown} />
        <LayoutSeparator />
        <div className="min-w-0">
          <section className="min-w-0 px-0 py-6 md:p-6">
            <FieldGroup>
              <section className="flex min-w-0 flex-col gap-10 md:flex-row">
                <div className="w-full min-w-0">
                  <EditorThumbnailField initThumbnail={thumbnailSrc} />
                </div>
                <div className="flex w-full min-w-0 flex-col gap-6">
                  <EditorTagField initTags={post.tags} />
                  <EditorVisibilityField initVisibility={post.isPublic} />
                  <EditorDescriptionField
                    initDescription={post?.description ?? undefined}
                  />
                </div>
              </section>
            </FieldGroup>
          </section>
        </div>
        <div className="fixed inset-x-0 bottom-0 flex h-16 max-w-full border border-foreground/20 bg-background">
          <section className="flex min-w-0 flex-1 items-center gap-4 px-4 md:px-8">
            <Button variant="outline" size="icon" aria-label="Submit">
              <IconPhoto />
            </Button>
            <Button variant="outline" size="icon" aria-label="Submit">
              <IconVideo />
            </Button>
            <LayoutSeparator orientation="vertical" />
          </section>

          <section className="flex h-full shrink-0 items-center px-4 md:px-6">
            <div className="flex gap-2 md:gap-4">
              <EditorSaveAsDraftButton />
              <EditorSaveButton postId={post.id} />
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}
export default EditorForm
