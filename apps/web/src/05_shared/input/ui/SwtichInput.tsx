"use client"

import { type Ref, useRef, useState } from "react"
import { FieldLabel } from "@packages/ui/src/components/field"
import { Switch } from "@packages/ui/src/components/switch"

interface SwtichInputProps {
  id: string
  name: string
  label: {
    on: string
    off: string
  }
  defaultValue?: boolean
  value?: boolean
  onChange?: (nextValue: boolean) => void
  ref?: Ref<HTMLInputElement>
}

const SwtichInput = ({
  id,
  name,
  label,
  defaultValue = false,
  value,
  onChange,
  ref,
}: SwtichInputProps) => {
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)
  const [internalIsOn, setInternalIsOn] = useState<boolean>(defaultValue)
  const isOn = value ?? internalIsOn

  const syncHiddenInput = (checked: boolean) => {
    if (!hiddenInputRef.current) return

    hiddenInputRef.current.checked = checked
    hiddenInputRef.current.value = String(checked)
  }

  const handleCheckedChange = (checked: boolean) => {
    if (value === undefined) {
      setInternalIsOn(checked)
    }

    onChange?.(checked)
    syncHiddenInput(checked)
  }

  const setHiddenInputRef = (element: HTMLInputElement | null) => {
    hiddenInputRef.current = element

    if (typeof ref === "function") {
      ref(element)
    } else if (ref) {
      ref.current = element
    }

    if (!element) return

    element.checked = isOn
    element.value = String(isOn)
  }

  return (
    <div className="flex gap-4">
      <input
        ref={setHiddenInputRef}
        id={`${id}-hidden`}
        name={name}
        type="checkbox"
        checked={isOn}
        value={String(isOn)}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      <Switch id={id} checked={isOn} onCheckedChange={handleCheckedChange} />
      <FieldLabel htmlFor={id}>{isOn ? label.on : label.off}</FieldLabel>
    </div>
  )
}

export default SwtichInput
