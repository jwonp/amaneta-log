import { createServerRequestApi } from "@/lib/api/requestApi"
import { GetPostDraftIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import { redirect } from "next/navigation"

const EditorNewEditView = async () => {
  const requestAPi = await createServerRequestApi()
  const linkTo = await requestAPi
    .post<GetPostDraftIdResponse>("/posts/draft")
    .then((res) => {
      console.log({ data: res.data })
      return `/editor/edit/${res.data.id}`
    })
    .catch((err) => {
      console.error(err)
      return "/editor"
    })

  redirect(linkTo)

  return <></>
}
export default EditorNewEditView
