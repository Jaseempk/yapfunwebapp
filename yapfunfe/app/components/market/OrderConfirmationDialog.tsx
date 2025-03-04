import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface OrderStatus {
  status: "pending" | "success" | "error" | null;
  message: string;
}

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderStatus: OrderStatus;
  onRetry?: () => void;
}

export default function OrderConfirmationDialog({
  isOpen,
  onClose,
  orderStatus,
  onRetry,
}: OrderConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 sm:mx-auto rounded-xl">
        <DialogTitle>
          {orderStatus.status === "pending"
            ? "Processing Order"
            : orderStatus.status === "success"
            ? "Order Confirmed"
            : "Order Failed"}
        </DialogTitle>
        <DialogDescription className="space-y-4 rounded-xl">
          <div className="flex items-center gap-3 mt-2">
            {orderStatus.status === "pending" ? (
              <RefreshCcw className="w-5 h-5 animate-spin text-primary" />
            ) : orderStatus.status === "success" ? (
              <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 stroke-current stroke-2"
                  aria-hidden="true"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 stroke-current stroke-2"
                  aria-hidden="true"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <p role="status">{orderStatus.message}</p>
          </div>
        </DialogDescription>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            {orderStatus.status === "success" ? "Close" : "Dismiss"}
          </Button>
          {orderStatus.status === "error" && onRetry && (
            <Button
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
