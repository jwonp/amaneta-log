import type { Metadata } from "next"

const DEFAULT_SITE_URL = "https://blog.amaneta.me"
const DEFAULT_TITLE = "Amaneta Log"
const DEFAULT_DESCRIPTION =
  "Amaneta Log의 공개 블로그에서 개발, 보안, 프로토콜 관련 기록을 읽어보세요."

const SITE_NAME = "Amaneta Log"

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export const getSiteUrl = () => {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE_URL

  return trimTrailingSlash(configuredSiteUrl)
}

export const getSiteUrlObject = () => new URL(getSiteUrl())

export const toAbsoluteUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return new URL(normalizedPath, getSiteUrl()).toString()
}

export const getDefaultMetadata = (): Metadata => ({
  metadataBase: getSiteUrlObject(),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${DEFAULT_TITLE}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
})

export const getNoIndexMetadata = (
  title: string,
  description?: string
): Metadata => ({
  title,
  description,
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
})

const stripMarkdownSyntax = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export const getPostDescription = ({
  description,
  markdown,
}: {
  description?: string | null
  markdown?: string
}) => {
  const normalizedDescription = description?.trim()

  if (normalizedDescription) {
    return normalizedDescription
  }

  if (!markdown) {
    return DEFAULT_DESCRIPTION
  }

  const extracted = stripMarkdownSyntax(markdown)
  return extracted ? extracted.slice(0, 160) : DEFAULT_DESCRIPTION
}

export const getSiteName = () => SITE_NAME
export const getDefaultTitle = () => DEFAULT_TITLE
export const getDefaultDescription = () => DEFAULT_DESCRIPTION
