import { Button } from "./Button";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (details: { open: boolean }) => void
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    confirmColorPalette?: string
    isLoading?: boolean
    onConfirm: () => void
    onCancel?: () => void
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColorPalette = 'red',
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) { 

    const handleCancel = () => {
        if (onCancel) onCancel()
            onOpenChange({ open: false})
    }
    return (
        <Modal 
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            footer ={
                <>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}> {cancelText} </Button>
                <Button colorPalette={confirmColorPalette} onClick={onConfirm} loading={isLoading}> {confirmText} </Button>
                </>
            }
        >
            {description && <p> {description} </p>}
        </Modal>
    )
}

