
// --------------------------------------------------
// Imports
// --------------------------------------------------

import { describe, it, expect } from "vitest";
import { validateInvoice } from "../js/validation.js";

// --------------------------------------------------
// Valid Invoice Test Data
// --------------------------------------------------

const validInvoice = {
  invoiceNumber: "INV-001",
  currency: "KES",
  issueDate: "2026-10-20",
  dueDate: "2026-11-20",
  clientName: "John Doe",
  clientEmail: "john@example.com",
  description: "Website development",
  quantity: 2,
  unitPrice: 1000,
  taxRate: 16,
  discount: 0,
  paymentTerms: "Net 30",
  status: "draft"
};

// --------------------------------------------------
// Invoice Validation Tests
// --------------------------------------------------

describe("validateInvoice", () => {
  it("should return no errors for a valid invoice", () => {
    expect(validateInvoice(validInvoice)).toEqual({});
  });

  it("should require an invoice number", () => {
    const invoice = { ...validInvoice, invoiceNumber: "" };

    expect(validateInvoice(invoice).invoiceNumber).toBe(
      "Invoice number is required."
    );
  });

  it("should require a currency", () => {
    const invoice = { ...validInvoice, currency: "" };

    expect(validateInvoice(invoice).currency).toBe(
      "Please select a currency."
    );
  });

  it("should require issue and due dates", () => {
    const invoice = {
      ...validInvoice,
      issueDate: "",
      dueDate: ""
    };

    const errors = validateInvoice(invoice);

    expect(errors.issueDate).toBe("Issue date is required.");
    expect(errors.dueDate).toBe("Due date is required.");
  });

  it("should reject a due date before the issue date", () => {
    const invoice = {
      ...validInvoice,
      issueDate: "2026-11-20",
      dueDate: "2026-10-20"
    };

    expect(validateInvoice(invoice).dueDate).toBe(
      "Due date cannot be before the issue date."
    );
  });

  it("should require client details", () => {
    const invoice = {
      ...validInvoice,
      clientName: "",
      clientEmail: ""
    };

    const errors = validateInvoice(invoice);

    expect(errors.clientName).toBe("Client name is required.");
    expect(errors.clientEmail).toBe("Client email is required.");
  });

  it("should reject an invalid email address", () => {
    const invoice = {
      ...validInvoice,
      clientEmail: "invalid-email"
    };

    expect(validateInvoice(invoice).clientEmail).toBe(
      "Please enter a valid email address."
    );
  });

  it("should require an item description", () => {
    const invoice = { ...validInvoice, description: "" };

    expect(validateInvoice(invoice).description).toBe(
      "Item description is required."
    );
  });

  it("should reject an invalid quantity", () => {
    const invoice = { ...validInvoice, quantity: 0 };

    expect(validateInvoice(invoice).quantity).toBe(
      "Quantity must be a whole number greater than zero."
    );
  });

  it("should reject a unit price of zero", () => {
    const invoice = { ...validInvoice, unitPrice: 0 };

    expect(validateInvoice(invoice).unitPrice).toBe(
      "Unit price must be greater than zero."
    );
  });

  it("should reject a tax rate above 100%", () => {
    const invoice = { ...validInvoice, taxRate: 101 };

    expect(validateInvoice(invoice).taxRate).toBe(
      "Tax must be between 0 and 100%."
    );
  });

  it("should reject a negative discount", () => {
    const invoice = { ...validInvoice, discount: -1 };

    expect(validateInvoice(invoice).discount).toBe(
      "Discount cannot be negative."
    );
  });

  it("should reject a discount greater than the item subtotal", () => {
    const invoice = {
      ...validInvoice,
      quantity: 2,
      unitPrice: 100,
      discount: 201
    };

    expect(validateInvoice(invoice).discount).toBe(
      "Discount cannot exceed the item subtotal."
    );
  });

  it("should require payment terms", () => {
    const invoice = { ...validInvoice, paymentTerms: "" };

    expect(validateInvoice(invoice).paymentTerms).toBe(
      "Please select payment terms."
    );
  });

  it("should reject an invalid invoice status", () => {
    const invoice = { ...validInvoice, status: "cancelled" };

    expect(validateInvoice(invoice).status).toBe(
      "Please select a valid invoice status."
    );
  });
});
