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
import { Avatar } from "@packages/ui/src/components/avatar"

const EditorListItemCard = () => {
  return (
    <Card className="relative max-w-96 min-w-96 gap-0 rounded-none p-0">
      <Badge
        variant={"default"}
        className="absolute top-4 left-4 z-1 space-x-px rounded-xs bg-primary text-xs leading-4 hover:bg-primary hover:text-background"
      >
        발행됨
      </Badge>

      <AspectRatio ratio={16 / 9} className="relative overflow-hidden">
        <Image
          src="https://placehold.co/600x400.png"
          fill
          sizes="(max-width: 768px) 100vw, 600px"
          alt="Blog thumbnail placeholder"
          className="object-cover"
        />
      </AspectRatio>
      <div className="h-full w-full p-4">
        <div className="flex w-full flex-wrap gap-2 pb-2">
          <Badge
            variant={"ghost"}
            className="space-x-px px-0 text-xs leading-4 hover:bg-transparent hover:text-foreground"
          >
            프로토콜
          </Badge>
        </div>
        <CardHeader className="px-0">
          <CardTitle className="text-lg leading-7 font-medium">
            시스템 업데이트: 구조적 무결성 리팩토링
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-6">
          <p className="line-clamp-4 text-sm leading-5.5 font-medium">
            Card ContentCard ContentCard ContentCard ContentCard ContentCard
            ContentCard ContentCard ContentCard ContentCard Content Card
            ContentCard ContentCard ContentCard Content ContentCard ContentCard
            ContentCard ContentCard Content Card ContentCard ContentCard
            ContentCard Content
          </p>
        </CardContent>
        <LayoutSeparator />
        <CardFooter className="flex justify-between px-0 pt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6" />
            <p className="font-base space-x-px px-0 text-xs leading-4">
              프로토콜
            </p>
          </div>
          <div className="flex items-center">
            <p className="font-base px-0 text-xs leading-4 text-foreground/60">
              2024.05.12
            </p>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}
export default EditorListItemCard
