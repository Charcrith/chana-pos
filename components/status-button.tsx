"use client";

import { useTransition } from "react";
import { advanceStatusAction } from "@/lib/actions/orders";
import { NEXT_STATUS, STATUS_LABELS } from "@/lib/order-constants";
import type { OrderStatus } from "@/db/schema";
import { Button } from "@/components/ui";

export function AdvanceStatusButton({
  orderId,
  status,
  className = "",
}: {
  orderId: number;
  status: OrderStatus;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const next = NEXT_STATUS[status];
  if (!next) return null;

  return (
    <Button
      type="button"
      variant="primary"
      className={className}
      disabled={pending}
      onClick={() => {
        start(async () => {
          await advanceStatusAction(orderId);
        });
      }}
    >
      {pending ? "..." : `→ ${STATUS_LABELS[next]}`}
    </Button>
  );
}
