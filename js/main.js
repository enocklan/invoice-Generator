
import {
  getInvoices,
  updateInvoiceStatus,
  createInvoice
} from "./api.js";

import { validateInvoice } from "./validation.js";

// --------------------------------------------------
// Application state
// --------------------------------------------------

const currencySymbols = {
  KES: "KSh",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$"
};

const invoicesTableBody = document.querySelector("#invoices-table-body");
const filterButtons = document.querySelectorAll(".filter-btn");

let allInvoices = [];
let currentFilter = "all";

const exchangeRatesCache = {};

// --------------------------------------------------
// HTML safety helper
// --------------------------------------------------

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return replacements[character];
  });
}

// --------------------------------------------------
// Currency formatting
// --------------------------------------------------

function formatAmount(amount, currency = "KES") {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${currencySymbols[currency] || currency} 0.00`;
  }

  const formattedAmount = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount);

  return `${currencySymbols[currency] || currency} ${formattedAmount}`;
}

// --------------------------------------------------
// Exchange rates
// --------------------------------------------------

async function getExchangeRates(baseCurrency) {
  const currency = String(baseCurrency).trim().toUpperCase();

  if (exchangeRatesCache[currency]) {
    return exchangeRatesCache[currency];
  }

  const response = await fetch(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(currency)}`
  );

  if (!response.ok) {
    throw new Error("Could not fetch exchange rates.");
  }

  const data = await response.json();

  if (data.result !== "success" || !data.rates) {
    throw new Error("The exchange-rate service returned an error.");
  }

  exchangeRatesCache[currency] = data.rates;

  return data.rates;
}

async function convertAmount(amount, fromCurrency, toCurrency) {
  const numericAmount = Number(amount);
  const from = String(fromCurrency || "KES").toUpperCase();
  const to = String(toCurrency || "KES").toUpperCase();

  if (!Number.isFinite(numericAmount)) {
    return null;
  }

  if (from === to) {
    return numericAmount;
  }

  const rates = await getExchangeRates(from);
  const targetRate = Number(rates[to]);

  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    throw new Error(
      `No exchange rate available for ${from} to ${to}.`
    );
  }

  return numericAmount * targetRate;
}

// --------------------------------------------------
// Invoice status helpers
// --------------------------------------------------

function getStatus(invoice) {
  return String(invoice.status || "draft").toLowerCase();
}

function isPaid(invoice) {
  return getStatus(invoice) === "paid";
}

function isOverdue(invoice) {
  const status = getStatus(invoice);

  if (status === "paid" || status === "draft") {
    return false;
  }

  if (status === "overdue") {
    return true;
  }

  if (!["unpaid", "sent"].includes(status) || !invoice.dueDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${invoice.dueDate}T00:00:00`);

  return !Number.isNaN(dueDate.getTime()) && dueDate < today;
}

function isOutstanding(invoice) {
  const status = getStatus(invoice);

  return ["unpaid", "overdue"].includes(status);
}

// --------------------------------------------------
// Calculate dashboard totals
// --------------------------------------------------

async function calculateSummaryTotal(invoices, summaryType, currency) {
  const matchingInvoices = invoices.filter((invoice) => {
    if (summaryType === "outstanding") {
      return isOutstanding(invoice);
    }

    if (summaryType === "overdue") {
      return isOverdue(invoice);
    }

    if (summaryType === "paid") {
      return isPaid(invoice);
    }

    return false;
  });

  const convertedAmounts = await Promise.all(
    matchingInvoices.map(async (invoice) => {
      const amount = Number(invoice.amount);
      const invoiceCurrency = invoice.currency || "KES";

      if (!Number.isFinite(amount)) {
        return 0;
      }

      return convertAmount(amount, invoiceCurrency, currency);
    })
  );

  return convertedAmounts.reduce((total, amount) => {
    return total + (amount ?? 0);
  }, 0);
}

// --------------------------------------------------
// Update each summary card independently
// --------------------------------------------------

async function updateSummaryCards() {
  const cards = document.querySelectorAll("[data-summary]");

  await Promise.all(
    Array.from(cards).map(async (card) => {
      const summaryType = card.dataset.summary;
      const currencySelect = card.querySelector(".home-currency");
      const amountElement = card.querySelector(".card-amount");

      if (!currencySelect || !amountElement) {
        console.warn(
          `Check the HTML for the ${summaryType} card: ` +
          "it needs .home-currency and .card-amount elements."
        );
        return;
      }

      const selectedCurrency = currencySelect.value || "KES";

      amountElement.textContent = "Loading...";

      try {
        const total = await calculateSummaryTotal(
          allInvoices,
          summaryType,
          selectedCurrency
        );

        // Ignore results if the user selected another currency meanwhile.
        if (currencySelect.value !== selectedCurrency) {
          return;
        }

        amountElement.textContent = formatAmount(
          total,
          selectedCurrency
        );
      } catch (error) {
        console.error(
          `Could not calculate the ${summaryType} total:`,
          error
        );

        amountElement.textContent = "Rate unavailable";
      }
    })
  );
}

// Recalculate the relevant totals when a currency changes.
document.querySelectorAll(".home-currency").forEach((select) => {
  select.addEventListener("change", updateSummaryCards);
});

// --------------------------------------------------
// Invoice filters
// --------------------------------------------------

function getFilteredInvoices() {
  if (currentFilter === "all") {
    return allInvoices;
  }

  if (currentFilter === "unpaid" || currentFilter === "sent") {
    return allInvoices.filter((invoice) =>
      ["unpaid", "sent"].includes(getStatus(invoice))
    );
  }

  if (currentFilter === "overdue") {
    return allInvoices.filter(isOverdue);
  }

  return allInvoices.filter(
    (invoice) => getStatus(invoice) === currentFilter
  );
}

// --------------------------------------------------
// Render invoices
// --------------------------------------------------

function renderInvoices() {
  if (!invoicesTableBody) {
    return;
  }

  const filteredInvoices = getFilteredInvoices();

  if (filteredInvoices.length === 0) {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">
          No invoices found for this filter.
        </td>
      </tr>
    `;
    return;
  }

  invoicesTableBody.innerHTML = filteredInvoices.map((invoice) => {
    const status = getStatus(invoice);
    const invoiceId = escapeHTML(invoice.id);
    const invoiceNumber = escapeHTML(invoice.invoiceNumber || "N/A");
    const description = escapeHTML(
      invoice.description || invoice.clientName || "N/A"
    );
    const issueDate = escapeHTML(invoice.issueDate || "N/A");
    const dueDate = escapeHTML(invoice.dueDate || "N/A");
    const amount = formatAmount(
      invoice.amount,
      invoice.currency || "KES"
    );

    const statusLabel =
      status.charAt(0).toUpperCase() + status.slice(1);

    return `
      <tr>
        <td>${invoiceNumber}</td>
        <td>${description}</td>
        <td>${issueDate}</td>
        <td>${dueDate}</td>
        <td>${escapeHTML(amount)}</td>
        <td>
          <span class="status-badge status-${escapeHTML(status)}">
            ${escapeHTML(statusLabel)}
          </span>
        </td>
        <td>
          <label class="sr-only" for="status-${invoiceId}">
            Change status for ${invoiceNumber}
          </label>

          <select
            class="invoice-status-select"
            id="status-${invoiceId}"
            data-invoice-id="${invoiceId}"
            aria-label="Change status for ${invoiceNumber}"
          >
            <option value="draft" ${status === "draft" ? "selected" : ""}>
              Draft
            </option>
            <option value="unpaid" ${status === "unpaid" ? "selected" : ""}>
              Unpaid
            </option>
            <option value="paid" ${status === "paid" ? "selected" : ""}>
              Paid
            </option>
            <option value="overdue" ${status === "overdue" ? "selected" : ""}>
              Overdue
            </option>
          </select>
        </td>
      </tr>
    `;
  }).join("");
}

// --------------------------------------------------
// User feedback
// --------------------------------------------------

function showFeedback(message, type = "info") {
  const feedback = document.querySelector("#invoice-feedback");

  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.className = `invoice-feedback ${type}`;
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
}

// --------------------------------------------------
// Change invoice status using PATCH
// --------------------------------------------------

async function handleStatusChange(event) {
  const select = event.target;

  if (!select.matches(".invoice-status-select")) {
    return;
  }

  const invoiceId = select.dataset.invoiceId;
  const newStatus = select.value;

  const invoice = allInvoices.find(
    (item) => String(item.id) === String(invoiceId)
  );

  if (!invoice) {
    showFeedback("Could not find this invoice.", "error");
    renderInvoices();
    return;
  }

  const previousStatus = getStatus(invoice);

  if (newStatus === previousStatus) {
    return;
  }

  select.disabled = true;
  showFeedback("Updating invoice status...", "info");

  try {
    const updatedInvoice = await updateInvoiceStatus(
      invoiceId,
      newStatus
    );

    invoice.status = getStatus(updatedInvoice);

    renderInvoices();
    await updateSummaryCards();

    showFeedback(
      `Invoice ${invoice.invoiceNumber} status updated successfully.`,
      "success"
    );
  } catch (error) {
    console.error("Could not update invoice status:", error);

    showFeedback(
      "Could not update invoice status. Check JSON Server and try again.",
      "error"
    );

    renderInvoices();
  }
}

if (invoicesTableBody) {
  invoicesTableBody.addEventListener("change", handleStatusChange);
}

// --------------------------------------------------
// Load invoices using GET
// --------------------------------------------------

async function loadInvoices() {
  if (invoicesTableBody) {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">
          Loading invoices...
        </td>
      </tr>
    `;
  }

  try {
    allInvoices = await getInvoices();

    renderInvoices();
    await updateSummaryCards();

    showFeedback(
      `${allInvoices.length} invoice(s) loaded.`,
      "success"
    );
  } catch (error) {
    console.error("Error loading invoices:", error);

    if (invoicesTableBody) {
      invoicesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-message">
            Could not load invoices. Check that JSON Server is running.
          </td>
        </tr>
      `;
    }

    showFeedback(
      "Could not load invoices. Please check your API connection.",
      "error"
    );
  }
}

// --------------------------------------------------
// Filter button event listeners
// --------------------------------------------------

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter || "all";

    filterButtons.forEach((filterButton) => {
      const active = filterButton === button;

      filterButton.classList.toggle("active", active);
      filterButton.setAttribute("aria-pressed", String(active));
    });

    renderInvoices();
  });
});

// --------------------------------------------------
// Create invoice form
// --------------------------------------------------

function setupCreateInvoiceForm() {
  const form = document.querySelector("#create-invoice-form");
  const section = document.querySelector("#create-invoice-section");
  const feedback = document.querySelector("#create-invoice-feedback");

  if (!form || !section) {
    console.warn("Create invoice form or section was not found.");
    return;
  }

  const errorFields = {
    invoiceNumber: "invoice-number-error",
    currency: "invoice-currency-error",
    status: "invoice-status-error",
    issueDate: "issue-date-error",
    dueDate: "due-date-error",
    clientName: "client-name-error",
    clientEmail: "client-email-error",
    description: "item-description-error",
    quantity: "item-quantity-error",
    unitPrice: "item-price-error",
    taxRate: "tax-rate-error",
    discount: "discount-error"
  };

  function clearErrors() {
    Object.values(errorFields).forEach((id) => {
      const errorElement = document.getElementById(id);

      if (errorElement) {
        errorElement.textContent = "";
      }
    });

    if (feedback) {
      feedback.textContent = "";
    }
  }

  function openForm() {
    section.hidden = false;
    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    document.querySelector("#invoice-number")?.focus();
  }

  function closeForm() {
    section.hidden = true;
    form.reset();
    clearErrors();
  }

  document.querySelectorAll(
    "#new-invoice-btn, #create-invoice-btn, [data-action='create-invoice']"
  ).forEach((button) => {
    button.addEventListener("click", openForm);
  });

  document.querySelectorAll(
    "#cancel-invoice-btn, #cancel-invoice-btn-bottom"
  ).forEach((button) => {
    button.addEventListener("click", closeForm);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(form);
    const invoice = Object.fromEntries(formData.entries());

    // The Save as Draft button always creates a draft.
    const submitAction = event.submitter?.value;

    if (submitAction === "draft") {
      invoice.status = "draft";
    }

    const errors = validateInvoice(invoice);

    Object.entries(errors).forEach(([field, message]) => {
      const errorId = errorFields[field];
      const errorElement = errorId
        ? document.getElementById(errorId)
        : null;

      if (errorElement) {
        errorElement.textContent = message;
      }
    });

    if (Object.keys(errors).length > 0) {
      if (feedback) {
        feedback.textContent =
          "Please correct the errors before continuing.";
      }

      return;
    }

    const quantity = Number(invoice.quantity);
    const unitPrice = Number(invoice.unitPrice);
    const taxRate = Number(invoice.taxRate);
    const discount = Number(invoice.discount);

    const subtotal = quantity * unitPrice;
    const taxableAmount = subtotal - discount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const totalAmount = taxableAmount + taxAmount;

    const invoiceToSave = {
      invoiceNumber: invoice.invoiceNumber.trim(),
      clientName: invoice.clientName.trim(),
      clientEmail: invoice.clientEmail.trim(),
      description: invoice.description.trim(),
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      status: invoice.status,
      quantity,
      unitPrice,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      amount: Number(totalAmount.toFixed(2)),
      paymentTerms: invoice.paymentTerms,
      notes: (invoice.notes || "").trim()
    };

    const submitButtons = form.querySelectorAll(
      'button[type="submit"]'
    );

    submitButtons.forEach((button) => {
      button.disabled = true;
    });

    if (feedback) {
      feedback.textContent = "Saving invoice...";
    }

    try {
      // POST creates a new invoice in JSON Server.
      const savedInvoice = await createInvoice(invoiceToSave);

      allInvoices.push(savedInvoice);

      // Show the newly created invoice immediately.
      currentFilter = "all";

      filterButtons.forEach((button) => {
        const active = (button.dataset.filter || "all") === "all";

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      renderInvoices();
      await updateSummaryCards();

      showFeedback(
        `Invoice ${savedInvoice.invoiceNumber} created successfully.`,
        "success"
      );

      form.reset();
      clearErrors();
      section.hidden = true;
    } catch (error) {
      console.error("Could not create invoice:", error);

      if (feedback) {
        feedback.textContent =
          "Could not save the invoice. Check that JSON Server is running and try again.";
      }
    } finally {
      submitButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  });
}

// --------------------------------------------------
// Start the application
// --------------------------------------------------

setupCreateInvoiceForm();
loadInvoices();
