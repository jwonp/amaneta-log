import { useQuery } from "@tanstack/react-query"

export const useEditorFormApi = () => {
  const editorFormQuery = useQuery({
    queryKey: [],
    queryFn: () => {},
  })
  return {}
}
