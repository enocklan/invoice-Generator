
// --------------------------------------------------
// Imports
// --------------------------------------------------

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  getInvoices,
  updateInvoiceStatus,
  createInvoice,
  deleteInvoice
} from "../js/api.js";

// --------------------------------------------------
// Test Setup
// --------------------------------------------------

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// --------------------------------------------------
// GET: Retrieve Invoices
// --------------------------------------------------

describe("getInvoices", () => {
  it("should return the list of invoices", async () => {
    const invoices = [
      { id: "1", invoiceNumber: "INV-001", status: "unpaid" },
      { id: "2", invoiceNumber: "INV-002", status: "paid" }
    ];

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(invoices)
    });

    const result = await getInvoices();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/invoices"
    );
    expect(result).toEqual(invoices);
  });

  it("should throw an error when loading invoices fails", async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(getInvoices()).rejects.toThrow(
      "Failed to load invoices."
    );
  });
});

// --------------------------------------------------
// PATCH: Update Invoice Status
// --------------------------------------------------

describe("updateInvoiceStatus", () => {
  it("should update an invoice status", async () => {
    const updatedInvoice = {
      id: "1",
      status: "paid"
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedInvoice)
    });

    const result = await updateInvoiceStatus("1", "paid");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/invoices/1",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: "paid" })
      }
    );

    expect(result).toEqual(updatedInvoice);
  });

  it("should throw an error when updating status fails", async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(
      updateInvoiceStatus("1", "paid")
    ).rejects.toThrow("Failed to update invoice status.");
  });
});

// --------------------------------------------------
// POST: Create Invoice
// --------------------------------------------------

describe("createInvoice", () => {
  it("should create and return a new invoice", async () => {
    const invoice = {
      invoiceNumber: "INV-003",
      status: "draft",
      amount: 1500
    };

    const savedInvoice = {
      id: "3",
      ...invoice
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(savedInvoice)
    });

    const result = await createInvoice(invoice);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/invoices",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(invoice)
      }
    );

    expect(result).toEqual(savedInvoice);
  });

  it("should throw an error when creating an invoice fails", async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(
      createInvoice({ invoiceNumber: "INV-003" })
    ).rejects.toThrow("Failed to create invoice.");
  });
});

// --------------------------------------------------
// DELETE: Delete Invoice
// --------------------------------------------------

describe("deleteInvoice", () => {
  it("should delete an invoice successfully", async () => {
    fetch.mockResolvedValue({ ok: true });

    const result = await deleteInvoice("1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/invoices/1",
      { method: "DELETE" }
    );

    expect(result).toBe(true);
  });

  it("should encode the invoice ID in the request URL", async () => {
    fetch.mockResolvedValue({ ok: true });

    await deleteInvoice("invoice 1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/invoices/invoice%201",
      { method: "DELETE" }
    );
  });

  it("should throw an error when deleting an invoice fails", async () => {
    fetch.mockResolvedValue({ ok: false });

    await expect(deleteInvoice("1")).rejects.toThrow(
      "Could not delete invoice."
    );
  });
});
