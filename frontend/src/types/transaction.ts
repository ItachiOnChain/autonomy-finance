// Transaction state and toast notification types

export type TransactionStatus =
    | 'idle'
    | 'uploading'
    | 'preparing'
    | 'signing'
    | 'pending'
    | 'success'
    | 'error';

export interface TransactionState {
    status: TransactionStatus;
    message: string;
    txHash?: string;
    ipId?: string;
    explorerLink?: string;
    error?: string;
}

export interface TransactionToastProps {
    status: TransactionStatus;
    message: string;
    txHash?: string;
    ipId?: string;
    explorerLink?: string;
    onRetry?: () => void;
    onDismiss: () => void;
}
