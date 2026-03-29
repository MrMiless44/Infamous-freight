import {
  PaymentProvider,
  PaymentStatus,
  PaymentType,
} from "@infamous-freight/shared/payments/types";

type PaymentItem = {
  id: string;
  provider: PaymentProvider;
  paymentType: PaymentType;
  amountCents: number;
  status: PaymentStatus;
  createdAt: string;
};

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

export default function PaymentHistoryCard({ items }: { items: PaymentItem[] }) {
  return (
    <div className="rounded-2xl border p-4">
      <h3 className="mb-4 text-lg font-semibold">Payment History</h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div>
              <div className="font-medium capitalize">
                {item.paymentType} · {item.provider}
              </div>
              <div className="text-sm opacity-70">
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold">{formatMoney(item.amountCents)}</div>
              <div className="text-sm uppercase">{item.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
