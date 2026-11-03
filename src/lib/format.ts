const symbols: Record<string, string> = { USD: "USD", AOA: "Kz", EUR: "EUR" };

/** Mostra o valor na moeda original — sem conversão automática. */
export function formatMoney(amount: number, currency: string) {
  const n = new Intl.NumberFormat("pt-AO", { maximumFractionDigits: 2 }).format(amount);
  return currency === "AOA" ? `${n} Kz` : `${n} ${symbols[currency] ?? currency}`;
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("pt-AO", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Luanda",
  }).format(new Date(iso));
}
