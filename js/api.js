
const API_URL = "http://localhost:3000/invoices";

export async function getInvoices() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to load invoices.");
  }

  return await response.json();
}
