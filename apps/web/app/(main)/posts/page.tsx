import FilterSelect from "@/src/05_shared/select/ui/FilterSelect"
import HeaderMenuButton from "@/src/05_shared/button/ui/HeaderMenuButton"
import LayoutSeparator from "@/src/05_shared/separator/ui/LayoutSeparator"
import BlogListItemCard from "@/src/05_shared/card/ui/BlogListItemCard"

const BlogPage = () => {
  return (
    <div className="min-h-[calc(100svh-54px)] p-6">
      <div className="mb-4 flex h-9 w-full">
        <div className="flex w-full justify-between">
          <div className="flex h-8 gap-2">
            <HeaderMenuButton label={"전체"} isSelected />
            <HeaderMenuButton label={"프로토콜"} />
            <HeaderMenuButton label={"보안"} />
            <HeaderMenuButton label={"전체"} />
          </div>
          <FilterSelect />
        </div>
      </div>
      <LayoutSeparator />
      <div className="my-6 min-h-[calc(100svh-81px)]">
        <div className="grid w-full grid-cols-[repeat(auto-fit,384px)] justify-center gap-4">
          <BlogListItemCard />
          <BlogListItemCard />
          <BlogListItemCard />
          <BlogListItemCard />
          <BlogListItemCard />
          <BlogListItemCard />
          <BlogListItemCard />
          <BlogListItemCard />
        </div>
      </div>
    </div>
  )
}
export default BlogPage
