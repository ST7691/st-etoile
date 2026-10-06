const storeId = process.env.SSLCOMMERZ_STORE_ID;
const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

const isLive = String(process.env.SSLCOMMERZ_IS_LIVE).toLowerCase() === "true";

export const sslcommerzConfig = {
  store_id: storeId,
  store_passwd: storePassword,
  is_live: isLive,
};

export const sslcommerzBaseUrl = isLive
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

/**
 * Validate a successful SSLCommerz transaction.
 *
 * SSLCommerz validationserver verifies the transaction
 * independently on the server side.
 */
export async function validateSSLCommerzPayment({ valId, tranId }) {
  if (!valId && !tranId) {
    throw new Error("SSLCommerz validation requires val_id or tran_id.");
  }

  const params = new URLSearchParams({
    store_id: storeId || "",
    store_passwd: storePassword || "",
    format: "json",
  });

  if (valId) {
    params.set("val_id", valId);
  } else {
    params.set("tran_id", tranId);
  }

  const response = await fetch(
    `${sslcommerzBaseUrl}/validator/api/validationserverAPI.php?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `SSLCommerz validation request failed with status ${response.status}.`,
    );
  }

  const result = await response.json();

  return result;
}
