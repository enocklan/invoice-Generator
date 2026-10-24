
// --------------------------------------------------
// Imports
// --------------------------------------------------

import { describe, it, expect } from "vitest";

import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateInvoiceAmounts
} from "../js/invoice.js";

// --------------------------------------------------
// Subtotal Tests
// --------------------------------------------------

describe("calculateSubtotal", () => {
  it("should calculate quantity multiplied by unit price", () => {
    expect(calculateSubtotal(2, 1000)).toBe(2000);
  });

  it("should handle decimal unit prices", () => {
    expect(calculateSubtotal(3, 10.5)).toBe(31.5);
  });
});

// --------------------------------------------------
// Tax Tests
// --------------------------------------------------

describe("calculateTax", () => {
  it("should calculate tax correctly", () => {
    expect(calculateTax(2000, 16)).toBe(320);
  });

  it("should return zero when the tax rate is zero", () => {
    expect(calculateTax(2000, 0)).toBe(0);
  });
});

// --------------------------------------------------
// Total Tests
// --------------------------------------------------

describe("calculateTotal", () => {
  it("should add tax and subtract the discount", () => {
    expect(calculateTotal(2000, 320, 100)).toBe(2220);
  });

  it("should use zero as the default discount", () => {
    expect(calculateTotal(2000, 320)).toBe(2320);
  });
});

// --------------------------------------------------
// Complete Invoice Calculation Tests
// --------------------------------------------------

describe("calculateInvoiceAmounts", () => {
  it("should calculate all invoice amounts", () => {
    const invoice = {
      quantity: 2,
      unitPrice: 1000,
      taxRate: 16,
      discount: 100
    };

    expect(calculateInvoiceAmounts(invoice)).toEqual({
      subtotal: 2000,
      taxAmount: 320,
      discount: 100,
      total: 2220
    });
  });

  it("should calculate an invoice without a discount", () => {
    const invoice = {
      quantity: 1,
      unitPrice: 500,
      taxRate: 0,
      discount: 0
    };

    expect(calculateInvoiceAmounts(invoice)).toEqual({
      subtotal: 500,
      taxAmount: 0,
      discount: 0,
      total: 500
    });
  });
});
