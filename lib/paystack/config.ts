export const paystackConfig = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
  secretKey: process.env.PAYSTACK_SECRET_KEY || "",
  callbackUrl: process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/paystack/callback`
    : typeof window !== "undefined"
      ? `${window.location.origin}/api/paystack/callback`
      : "/api/paystack/callback",
}

export const formatAmount = (amountInCents: number): string => {
  return `R${(amountInCents / 100).toFixed(2)}`
}

export const formatCurrency = (amount: number, currency = "ZAR"): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: currency,
  }).format(amount / 100)
}
