
// --------------------------------------------------
// Calculate Invoice Subtotal
// --------------------------------------------------

export function calculateSubtotal(quantity, unitPrice) {
  return Number(quantity) * Number(unitPrice);
}

// --------------------------------------------------
// Calculate Tax Amount
// --------------------------------------------------

export function calculateTax(subtotal, taxRate) {
  return Number(subtotal) * (Number(taxRate) / 100);
}

// --------------------------------------------------
// Calculate Final Invoice Total
// --------------------------------------------------

export function calculateTotal(subtotal, taxAmount, discount = 0) {
  return Number(subtotal) + Number(taxAmount) - Number(discount);
}

// --------------------------------------------------
// Calculate All Invoice Amounts
// --------------------------------------------------

export function calculateInvoiceAmounts(invoice) {
  const subtotal = calculateSubtotal(
    invoice.quantity,
    invoice.unitPrice
  );

  const taxAmount = calculateTax(
    subtotal,
    invoice.taxRate
  );

  const total = calculateTotal(
    subtotal,
    taxAmount,
    invoice.discount
  );

  return {
    subtotal,
    taxAmount,
    discount: Number(invoice.discount),
    total
  };
}
