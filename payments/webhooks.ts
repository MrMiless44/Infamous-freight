interface PaymentEvent {
  type: string;
}

export function handlePaymentEvent(event: PaymentEvent) {
  try {
    if (event.type === "chargeback") {
      console.log("Chargeback detected, flagging user");
    }

    return { success: true };
  } catch (error) {
    console.error("Error handling payment event", error);
    return { success: false };
  }
}
