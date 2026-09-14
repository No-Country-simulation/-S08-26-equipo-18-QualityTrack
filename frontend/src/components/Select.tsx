import { NativeSelect, type NativeSelectFieldProps } from "@chakra-ui/react";

export interface SelectOption {
    label: string
    value: string | number
}

export interface SelectProps extends NativeSelectFieldProps {
    items?: SelectOption[]
}

export function Select ({ items, children, ...props}: SelectProps) {
    return (
        <NativeSelect.Root>
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