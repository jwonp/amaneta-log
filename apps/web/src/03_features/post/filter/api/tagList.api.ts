"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import type { Tag } from "../model/tag.type"

export const useTagListApi = () =>
  useQuery({
    queryKey: ["tag-list"],
    queryFn: async (): Promise<Tag[]> => {
      const res = await axios.get<Tag[]>("/api/tags")
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
