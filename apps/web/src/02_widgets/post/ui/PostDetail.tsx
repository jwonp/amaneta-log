import Image from "next/image"
import MarkdownArticle from "@/src/04_entities/markdown/ui/MarkdownArticle"
import { GetPostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import { Badge } from "@packages/ui/src/components/badge"
import { Avatar, AvatarImage } from "@packages/ui/src/components/avatar"
import { toAbsoluteUrl } from "@/src/05_shared/seo/lib/seo"

const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
  }).format(new Date(value))

const getThumbnailSrc = (postId: number, thumbnail?: string) => {
  if (!thumbnail) {
    return undefined
  }

  if (thumbnail.startsWith("http://") || thumbnail.startsWith("https://")) {
    return thumbnail
  }

  return toAbsoluteUrl(
    thumbnail.startsWith("/")
      ? thumbnail
      : `/api/storage/${postId}/files/${thumbnail}`
  )
}

const PostDetail = ({ postDetail }: { postDetail: GetPostByIdResponse }) => {
  const description = postDetail.post.description?.trim()
  const thumbnailSrc = getThumbnailSrc(
    postDetail.post.id,
    postDetail.post.thumbnail
  )

  return (
    <article className="w-full px-4 py-8 md:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-6 border-b border-border pb-8">
          {postDetail.post.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {postDetail.post.tags.map((tag) => (
                <li key={`${postDetail.post.id}-${tag}`} className="list-none">
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-2.5 py-1 text-xs text-foreground/90"
                  >
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground md:text-4xl">
              {postDetail.post.title}
            </h1>
            {description ? (
              <p className="text-base leading-7 text-foreground/85 md:text-lg">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/80">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src="/user.svg"
                  alt=""
                  className="block h-7 w-auto dark:hidden"
                />
                <AvatarImage
                  src="/user-white.svg"
                  alt=""
                  className="hidden h-7 w-auto dark:block"
                />
              </Avatar>
              <span>{postDetail.author.username}</span>
            </div>
            <span aria-hidden="true">·</span>
            <time dateTime={new Date(postDetail.post.createdAt).toISOString()}>
              {formatDate(postDetail.post.createdAt)}
            </time>
            <span aria-hidden="true">·</span>
            <span>
              수정 {formatDate(postDetail.post.updatedAt)}
            </span>
          </div>

          {thumbnailSrc ? (
            <div className="relative overflow-hidden rounded-md border border-border">
              <Image
                src={thumbnailSrc}
                alt={`${postDetail.post.title} 대표 이미지`}
                width={1200}
                height={630}
                sizes="(max-width: 768px) 100vw, 768px"
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          ) : null}
        </header>

        <div className="min-w-0">
          <MarkdownArticle markdown={postDetail.post.markdown} />
        </div>
      </div>
    </article>
  )
}

export default PostDetail
