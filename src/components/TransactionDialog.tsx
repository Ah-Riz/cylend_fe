"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Hex } from "viem";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "pending" | "confirming" | "success" | "error" | null;
  hash?: Hex | null;
  title?: string;
  description?: string;
  errorMessage?: string;
  onClose?: () => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  status,
  hash,
  title,
  description,
  errorMessage,
  onClose,
}: TransactionDialogProps) {
  const getExplorerUrl = (hash: Hex) => {
    // Ensure hash is a string
    const hashStr = typeof hash === 'string' ? hash : String(hash);
    // TODO: Get chain ID and use appropriate explorer
    // For now, default to Mantle Sepolia
    return `https://sepolia.mantlescan.xyz/tx/${hashStr}`;
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === "pending" && String(typeof title === 'string' ? title : "Transaction Pending")}
            {status === "confirming" && String(typeof title === 'string' ? title : "Confirming Transaction")}
            {status === "success" && String(typeof title === 'string' ? title : "Transaction Successful")}
            {status === "error" && String(typeof title === 'string' ? title : "Transaction Failed")}
          </DialogTitle>
          {status && (
            <DialogDescription>
              {status === "pending" &&
                String(typeof description === 'string' ? description : "Please confirm the transaction in your wallet.")}
              {status === "confirming" &&
                String(typeof description === 'string' ? description : "Waiting for blockchain confirmation...")}
              {status === "success" &&
                String(typeof description === 'string' ? description : "Your transaction has been confirmed.")}
              {status === "error" &&
                String(
                  typeof errorMessage === 'string' 
                    ? errorMessage 
                    : typeof description === 'string' 
                    ? description 
                    : "Transaction failed. Please try again."
                )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          {/* Status Icon */}
          {status === "pending" && (
            <div className="relative">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
          )}
          {status === "confirming" && (
            <div className="relative">
              <BlockchainLoader size="lg" />
            </div>
          )}
          {status === "success" && (
            <CheckCircle2 className="h-12 w-12 text-success" />
          )}
          {status === "error" && (
            <XCircle className="h-12 w-12 text-destructive" />
          )}

          {/* Transaction Hash */}
          {hash && (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Transaction Hash</p>
              <p className="font-mono text-xs break-all">{typeof hash === 'string' ? hash : String(hash)}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const hashStr = typeof hash === 'string' ? hash : String(hash);
                  window.open(getExplorerUrl(hashStr as Hex), "_blank");
                }}
                className="mt-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          )}

          {/* Error Message */}
          {status === "error" && errorMessage && (
            <div className="text-center">
              <p className="text-sm text-destructive">
                {typeof errorMessage === 'string' ? errorMessage : String(errorMessage || 'Unknown error')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {status === "success" && (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
          {status === "error" && (
            <Button onClick={handleClose} variant="outline" className="w-full">
              Close
            </Button>
          )}
          {(status === "pending" || status === "confirming") && (
            <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
              Close (Transaction will continue)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

