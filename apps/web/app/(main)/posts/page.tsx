import type { Metadata } from "next"
import PostView from "@/src/01_views/post/ui/PostListView"
import { getCachedInitialPostList } from "@/src/03_features/post/api/postList.server"
import {
  getDefaultDescription,
  getSiteName,
  toAbsoluteUrl,
} from "@/src/05_shared/seo/lib/seo"
import JsonLd from "@/src/05_shared/seo/ui/JsonLd"
import AnalyticsTracker from "@/src/03_features/analytics/ui/AnalyticsTracker"

export const metadata: Metadata = {
  title: "블로그",
  description:
    "Amaneta Log의 공개 게시물 목록입니다. 개발, 프로토콜, 보안 관련 글을 확인할 수 있습니다.",
  alternates: {
    canonical: "/posts",
  },
  openGraph: {
    type: "website",
    url: "/posts",
    title: "Amaneta Log 블로그",
    description:
      "Amaneta Log의 공개 게시물 목록입니다. 개발, 프로토콜, 보안 관련 글을 확인할 수 있습니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amaneta Log 블로그",
    description:
      "Amaneta Log의 공개 게시물 목록입니다. 개발, 프로토콜, 보안 관련 글을 확인할 수 있습니다.",
  },
}

const PostPage = async () => {
  const initialPage = await getCachedInitialPostList()
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: getSiteName(),
    description: getDefaultDescription(),
    url: toAbsoluteUrl("/posts"),
    inLanguage: "ko-KR",
  }

  return (
    <>
      <JsonLd id="blog-json-ld" data={jsonLd} />
      <AnalyticsTracker pageType="POST_LIST" pagePath="/posts" />
      <PostView initialPage={initialPage} />
    </>
  )
}
export default PostPage
