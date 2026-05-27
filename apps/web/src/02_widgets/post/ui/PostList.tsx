"use client"
import { AspectRatio } from "@packages/ui/src/components/aspect-ratio"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@packages/ui/src/components/card"
import { Skeleton } from "@packages/ui/src/components/skeleton"
import { Button } from "@packages/ui/src/components/button"
import Link from "next/link"
import { useRef, useEffect } from "react"
import { usePostListApi } from "@/src/03_features/post/api/postList.api"
import PostListItemCard from "@/src/05_shared/card/ui/PostListItemCard"
import { GetPostListResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import type { SortOrder } from "@/src/03_features/post/filter/model/sort.type"

const SKELETON_CARD_COUNT = 6

const PostListSkeletonCard = () => {
  return (
    <Card className="max-w-96 min-w-96 gap-0 rounded-none p-0">
      <AspectRatio ratio={16 / 9}>
        <Skeleton className="h-full w-full rounded-none" />
      </AspectRatio>

      <div className="h-full w-full p-4">
        <div className="flex gap-2 pb-2">
          <Skeleton className="h-5 w-14 rounded-xs" />
          <Skeleton className="h-5 w-18 rounded-xs" />
        </div>

        <CardHeader className="px-0">
          <Skeleton className="h-7 w-4/5 rounded-xs" />
          <Skeleton className="h-7 w-2/3 rounded-xs" />
        </CardHeader>

        <CardContent className="space-y-2 px-0 pb-6">
          <Skeleton className="h-5 w-full rounded-xs" />
          <Skeleton className="h-5 w-full rounded-xs" />
          <Skeleton className="h-5 w-3/4 rounded-xs" />
        </CardContent>

        <Skeleton className="h-px w-full rounded-none" />

        <CardFooter className="justify-between px-0 pt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-xs" />
          </div>
          <Skeleton className="h-4 w-16 rounded-xs" />
        </CardFooter>
      </div>
    </Card>
  )
}

const PostListSkeletonGrid = ({ count }: { count: number }) => {
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fit,384px)] justify-center gap-4">
      {Array.from({ length: count }, (_, index) => (
        <PostListSkeletonCard key={`post-list-skeleton-${index}`} />
      ))}
    </div>
  )
}

interface PostListProps {
  initialPage?: GetPostListResponse
  selectedTags?: string[]
  sort?: SortOrder
  onClearFilters?: () => void
}

const PostList = ({
  initialPage,
  selectedTags = [],
  sort = "newest",
  onClearFilters,
}: PostListProps) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const filters = {
    ...(selectedTags.length > 0 && { tag: selectedTags.join(",") }),
    sort,
  }
  const {
    items,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostListApi({
    filters,
    initialPage: selectedTags.length === 0 && sort === "newest" ? initialPage : undefined,
  })

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || !hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (entry?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      {
        rootMargin: "200px 0px",
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isLoading) {
    return (
      <div className="my-6 min-h-[calc(100svh-81px)]">
        <PostListSkeletonGrid count={SKELETON_CARD_COUNT} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="my-6 min-h-[calc(100svh-81px)]">
        <div className="flex min-h-40 items-center justify-center text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "목록을 불러오지 못했습니다."}
        </div>
      </div>
    )
  }
  return (
    <div className="my-6 min-h-[calc(100svh-81px)]">
      <ol className="grid w-full list-none grid-cols-[repeat(auto-fit,384px)] justify-center gap-4 p-0">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link href={`/posts/${item.id}`} className="block h-full">
              <PostListItemCard {...item} prioritizeImage={index === 0} />
            </Link>
          </li>
        ))}
      </ol>

      {items.length === 0 && (
        <div className="flex min-h-60 flex-col items-center justify-center gap-4">
          <p className="text-sm text-foreground/60">
            {selectedTags.length > 0
              ? "선택한 태그에 해당하는 게시물이 없습니다."
              : "아직 작성한 게시물이 없습니다."}
          </p>
          {selectedTags.length > 0 && onClearFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              전체 해제
            </Button>
          )}
        </div>
      )}

      <div ref={loadMoreRef} className="h-10" />

      {isFetchingNextPage && (
        <div className="mt-4">
          <PostListSkeletonGrid count={2} />
        </div>
      )}
    </div>
  )
}

export default PostList
