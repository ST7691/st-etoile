import { prisma } from "@/lib/prisma";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz";

export async function verifySSLCommerzPayment({ valId, tranId, orderId }) {
  if (!valId && !tranId) {
    throw new Error("Payment validation information is missing.");
  }

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      payment: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!order.payment) {
    throw new Error("Payment record not found.");
  }

  /*
   * If already paid, don't process again.
   */

  if (order.payment.status === "PAID") {
    return {
      success: true,
      alreadyPaid: true,
      order,
    };
  }

  const validation = await validateSSLCommerzPayment({
    valId,
    tranId,
  });

  console.log("SSLCOMMERZ VALIDATION:", validation);

  const validationStatus = String(validation?.status || "").toUpperCase();

  const validationTranId =
    validation?.tran_id || validation?.bank_tran_id || null;

  const validatedAmount = Number(validation?.amount || 0);

  const orderAmount = Number(order.total);

  /*
   * SSLCommerz must confirm valid payment.
   */

  if (validationStatus !== "VALID" && validationStatus !== "VALIDATED") {
    throw new Error(
      validation?.error || "SSLCommerz payment validation failed.",
    );
  }

  /*
   * Verify transaction ID.
   */

  if (
    tranId &&
    validation?.tran_id &&
    String(validation.tran_id) !== String(tranId)
  ) {
    throw new Error("Transaction ID verification failed.");
  }

  /*
   * Verify amount.
   */

  if (
    !Number.isFinite(validatedAmount) ||
    Math.abs(validatedAmount - orderAmount) > 0.01
  ) {
    throw new Error("Payment amount verification failed.");
  }

  /*
   * Mark payment as PAID.
   */

  const updatedPayment = await prisma.payment.update({
    where: {
      orderId: order.id,
    },
    data: {
      method: "SSLCOMMERZ",
      status: "PAID",
      transactionId: validationTranId || order.payment.transactionId || tranId,
      amount: order.total,
      paidAt: new Date(),
    },
  });

  /*
   * Confirm order.
   */

  const updatedOrder = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      status: "CONFIRMED",
    },
    include: {
      payment: true,
    },
  });

  return {
    success: true,
    alreadyPaid: false,
    payment: updatedPayment,
    order: updatedOrder,
  };
}
