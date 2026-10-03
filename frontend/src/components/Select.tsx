import { NativeSelect, type NativeSelectFieldProps } from "@chakra-ui/react";

export interface SelectOption {
    label: string
    value: string | number
}

export interface SelectProps extends NativeSelectFieldProps {
    items?: SelectOption[]
    disabled?: boolean
}

export function Select ({ items, children, disabled, ...props}: SelectProps) {
    return (
        <NativeSelect.Root disabled={disabled}>
        <NativeSelect.Field {...props}>
         {items ? items.map((item) => (
        <option key={item.value} value={item.value}> {item.label} </option>
         ))
         :children}
        </NativeSelect.Field>
       <NativeSelect.Indicator />
    </NativeSelect.Root>
    )
}
