import { Input as ChakraInput, type InputProps } from "@chakra-ui/react";

export function Input(props: InputProps) {
  const isDate = props.type === "date";

  return (
    <ChakraInput
      {...props}
      cursor={isDate && !props.disabled && !props.readOnly ? "pointer" : props.cursor}
      onClick={(e) => {
        if (isDate && !props.disabled && !props.readOnly) {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Fallback para entornos que no soporten showPicker
          }
        }
        props.onClick?.(e);
      }}
    />
  );
}

export type { InputProps };
