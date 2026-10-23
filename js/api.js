
const API_URL = "http://localhost:3000/invoices";



export async function getInvoices() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to load invoices.");
  }

  return response.json();
}

export async function updateInvoiceStatus(invoiceId, status) {
  const response = await fetch(`${API_URL}/${invoiceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error("Failed to update invoice status.");
  }

  return response.json();
}



export async function createInvoice(invoice) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(invoice)
  });

  if (!response.ok) {
    throw new Error("Failed to create invoice.");
  }

  return response.json();
}
