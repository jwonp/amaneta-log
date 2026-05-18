import { createServerRequestApi } from "@/lib/api/requestApi"
import { ApiResponse } from "@/src/05_shared/api/common/model/api.type"
import { GetEditablePostByIdResponse } from "@/src/05_shared/api/post/model/post.dto.type"
import { AxiosError } from "axios"
import EditorEditClientView from "./EditorEditClientView"

const EditorEditView = async ({ postId }: { postId: string }) => {
  const requestApi = await createServerRequestApi()
  const initPost: ApiResponse<GetEditablePostByIdResponse | undefined> =
    await requestApi
      .get<GetEditablePostByIdResponse>(`/posts/${postId}/edit`)
      .then((res) => {
        console.log(res.data)
        return { data: res.data, status: res.status }
      })
      .catch((err: AxiosError) => {
        console.error(err)
        return {
          data: undefined,
          status: err?.status || 500,
        }
      })

  if (!initPost?.data) return <></> //redirect("/editor")

  return <EditorEditClientView data={initPost.data} />
}
export default EditorEditView
