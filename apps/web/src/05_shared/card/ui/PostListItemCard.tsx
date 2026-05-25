import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@packages/ui/src/components/card"
import { AspectRatio } from "@packages/ui/src/components/aspect-ratio"
import { Badge } from "@packages/ui/src/components/badge"
import Image from "next/image"
import LayoutSeparator from "../../separator/ui/LayoutSeparator"
import { Avatar, AvatarImage } from "@packages/ui/src/components/avatar"
import { PostListItemCardProps } from "../model/card.type"
import { useId } from "react"
import { formatDate } from "../../lib/model/util.funcs"
const PostListItemCard = ({
  tags,
  title,
  description,
  updatedAt,
  thumbnailSrc,
  author,
  prioritizeImage = false,
}: PostListItemCardProps) => {
  const id = useId()
  return (
    <Card className="h-full max-w-96 min-w-96 gap-0 rounded-none p-0">
      <AspectRatio ratio={16 / 9} className="relative overflow-hidden">
        <Image
          src={thumbnailSrc || "/thumbnail-placeholder.svg"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 384px"
          alt={`${title} 대표 이미지`}
          className="object-cover"
          priority={prioritizeImage}
          loading={prioritizeImage ? "eager" : "lazy"}
        />
      </AspectRatio>
      <div className="h-full w-full p-4">
        <div className="flex w-full flex-wrap gap-2 pb-2">
          {tags.map((tag, index) => (
            <Badge
              key={`editor-list-item-card-tag-${id}-${index}`}
              variant={"ghost"}
              className="space-x-px px-0 text-xs leading-4 hover:bg-transparent hover:text-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <CardHeader className="px-0">
          <CardTitle className="text-lg leading-7 font-medium">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-6">
          <p className="line-clamp-4 text-sm leading-5.5 font-medium text-foreground/85">
            {description}
          </p>
        </CardContent>
        <LayoutSeparator />
        <CardFooter className="flex justify-between px-0 pt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src="/user.svg"
                alt="@shadcn"
                className="block h-6 w-auto dark:hidden"
              />
              <AvatarImage
                src="/user-white.svg"
                alt="@shadcn"
                className="hidden h-6 w-auto dark:block"
              />
            </Avatar>
            <p className="font-base space-x-px px-0 text-xs leading-4">
              {author}
            </p>
          </div>
          <div className="flex items-center">
            <p className="font-base px-0 text-xs leading-4 text-foreground/80" suppressHydrationWarning>
              {formatDate(updatedAt)}
            </p>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
export default PostListItemCard
