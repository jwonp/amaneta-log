import PostDetailView from "@/src/01_views/post/ui/PostDetailView"
import { isAppHttpError } from "@/lib/errors/app-error"
import { getPostDetail } from "@/src/03_features/post/api/postDetail.server"
import type { Metadata } from "next"
import { forbidden, notFound, redirect, unauthorized } from "next/navigation"
import {
  getPostDescription,
  getSiteName,
  toAbsoluteUrl,
} from "@/src/05_shared/seo/lib/seo"
import JsonLd from "@/src/05_shared/seo/ui/JsonLd"
import AnalyticsTracker from "@/src/03_features/analytics/ui/AnalyticsTracker"

const getPostThumbnailUrl = (postId: number, thumbnail?: string) => {
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

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{
    postId: string
  }>
}): Promise<Metadata> => {
  const { postId } = await params

  if (!/^\d+$/.test(postId)) {
    return {
      title: "잘못된 게시물",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  try {
    const postDetail = await getPostDetail(postId)
    const description = getPostDescription({
      description: postDetail.post.description,
      markdown: postDetail.post.markdown,
    })
    const canonicalPath = `/posts/${postId}`
    const thumbnailUrl = getPostThumbnailUrl(
      postDetail.post.id,
      postDetail.post.thumbnail
    )

    return {
      title: postDetail.post.title,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: "article",
        url: canonicalPath,
        title: postDetail.post.title,
        description,
        siteName: getSiteName(),
        publishedTime: new Date(postDetail.post.createdAt).toISOString(),
        modifiedTime: new Date(postDetail.post.updatedAt).toISOString(),
        images: thumbnailUrl ? [{ url: thumbnailUrl }] : undefined,
      },
      twitter: {
        card: thumbnailUrl ? "summary_large_image" : "summary",
        title: postDetail.post.title,
        description,
        images: thumbnailUrl ? [thumbnailUrl] : undefined,
      },
    }
  } catch (error) {
    if (isAppHttpError(error)) {
      return {
        title: "게시물을 찾을 수 없습니다.",
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    throw error
  }
}

const PostDetailPage = async ({
  params,
}: {
  params: Promise<{
    postId: string
  }>
}) => {
  const { postId } = await params

  if (!/^\d+$/.test(postId)) {
    redirect("/errors/400?reason=invalid-post-id")
  }

  try {
    const postDetail = await getPostDetail(postId)
    const description = getPostDescription({
      description: postDetail.post.description,
      markdown: postDetail.post.markdown,
    })
    const canonicalUrl = toAbsoluteUrl(`/posts/${postId}`)
    const imageUrl = getPostThumbnailUrl(
      postDetail.post.id,
      postDetail.post.thumbnail
    )
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: postDetail.post.title,
      description,
      author: {
        "@type": "Person",
        name: postDetail.author.username,
      },
      datePublished: new Date(postDetail.post.createdAt).toISOString(),
      dateModified: new Date(postDetail.post.updatedAt).toISOString(),
      image: imageUrl ? [imageUrl] : undefined,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
      publisher: {
        "@type": "Organization",
        name: getSiteName(),
      },
    }

    return (
      <>
        <JsonLd id={`blog-posting-${postId}`} data={jsonLd} />
        <AnalyticsTracker
          pageType="POST_DETAIL"
          pagePath={`/posts/${postId}`}
          postId={postDetail.post.id}
        />
        <PostDetailView postDetail={postDetail} />
      </>
    )
  } catch (error) {
    if (isAppHttpError(error)) {
      if (error.status === 401) {
        unauthorized()
      }

      if (error.status === 403) {
        forbidden()
      }

      if (error.status === 404) {
        notFound()
      }
    }

    throw error
  }
}

export default PostDetailPage
