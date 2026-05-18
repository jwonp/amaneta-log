"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import filterIcon from "@/public/filter-icon.svg"
import filterWhiteIcon from "@/public/filter-icon-white.svg"
import Image from "next/image"

const FilterSelect = () => {
  const options = [
    {
      label: "최신순",
      value: "recents",
    },
    {
      label: "조회순",
      value: "mostViews",
    },
  ] as const

  return (
    <div className="flex gap-4">
      <Select defaultValue={options[0].value}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position={"popper"}>
          <SelectGroup>
            {options.map(({ label, value }, index) => (
              <SelectItem
                key={`select-${label}-${value}-${index}`}
                value={value}
              >
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Image src={filterIcon} alt={""} className="dark:hidden" />
      <Image src={filterWhiteIcon} alt={""} className="hidden dark:block" />
    </div>
  )
}
export default FilterSelect
