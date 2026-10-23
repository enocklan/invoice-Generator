
export function validateInvoice(invoice) {
  const errors = {};

  // Invoice details
  if (!invoice.invoiceNumber?.trim()) {
    errors.invoiceNumber = "Invoice number is required.";
  }

  if (!invoice.currency?.trim()) {
    errors.currency = "Please select a currency.";
  }

  if (!invoice.issueDate) {
    errors.issueDate = "Issue date is required.";
  }

  if (!invoice.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  if (
    invoice.issueDate &&
    invoice.dueDate &&
    invoice.dueDate < invoice.issueDate
  ) {
    errors.dueDate = "Due date cannot be before the issue date.";
  }

  // Client details
  if (!invoice.clientName?.trim()) {
    errors.clientName = "Client name is required.";
  }

  if (!invoice.clientEmail?.trim()) {
    errors.clientEmail = "Client email is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.clientEmail.trim())
  ) {
    errors.clientEmail = "Please enter a valid email address.";
  }

  // Invoice item
  if (!invoice.description?.trim()) {
    errors.description = "Item description is required.";
  }

  const quantity = Number(invoice.quantity);
  const unitPrice = Number(invoice.unitPrice);
  const taxRate = Number(invoice.taxRate);
  const discount = Number(invoice.discount);
  const validStatuses = ["draft", "unpaid", "paid", "overdue"];

  if (
    invoice.quantity === "" ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    errors.quantity = "Quantity must be a whole number greater than zero.";
  }

  if (
    invoice.unitPrice === "" ||
    !Number.isFinite(unitPrice) ||
    unitPrice <= 0
  ) {
    errors.unitPrice = "Unit price must be greater than zero.";
  }

  if (
    invoice.taxRate === "" ||
    !Number.isFinite(taxRate) ||
    taxRate < 0 ||
    taxRate > 100
  ) {
    errors.taxRate = "Tax must be between 0 and 100%.";
  }

  if (
    invoice.discount === "" ||
    !Number.isFinite(discount) ||
    discount < 0
  ) {
    errors.discount = "Discount cannot be negative.";
  } else if (
    Number.isInteger(quantity) &&
    quantity > 0 &&
    Number.isFinite(unitPrice) &&
    unitPrice > 0 &&
    discount > quantity * unitPrice
  ) {
    errors.discount = "Discount cannot exceed the item subtotal.";
  }

  if (!invoice.paymentTerms?.trim()) {
    errors.paymentTerms = "Please select payment terms.";
  }

 

  if (!validStatuses.includes(invoice.status)) {
  errors.status = "Please select a valid invoice status.";
  }

  return errors;
}
