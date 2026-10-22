
import { getInvoices, updateInvoiceStatus } from "./api.js";

const currencySymbols = {
  KES: "KSh",
  USD: "$",
  EUR: "€",
  AUD: "A$"
};

const invoicesTableBody = document.querySelector("#invoices-table-body");
const filterButtons = document.querySelectorAll(".filter-btn");

let allInvoices = [];
let currentFilter = "all";

const exchangeRatesCache = {};

// Format amounts consistently
function formatAmount(amount, currency) {
  return `${currencySymbols[currency] || currency} ${
    new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }`;
}

// Fetch exchange rates using the selected base currency
async function getExchangeRates(baseCurrency) {
  if (exchangeRatesCache[baseCurrency]) {
    return exchangeRatesCache[baseCurrency];
  }

  const response = await fetch(
    `https://open.er-api.com/v6/latest/${baseCurrency}`
  );

  if (!response.ok) {
    throw new Error("Could not fetch exchange rates.");
  }

  const data = await response.json();

  if (data.result !== "success" || !data.rates) {
    throw new Error("The exchange-rate service returned an error.");
  }

  exchangeRatesCache[baseCurrency] = data.rates;

  return data.rates;
}

// Convert an amount from one currency to another
async function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates(fromCurrency);
  const targetRate = rates[toCurrency];

  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    throw new Error(
      `No exchange rate available for ${fromCurrency} to ${toCurrency}.`
    );
  }

  return amount * targetRate;
}

// Identify paid invoices
function isPaid(invoice) {
  return invoice.status?.toLowerCase() === "paid";
}

// Outstanding includes unpaid, sent and overdue invoices
function isOutstanding(invoice) {
  const status = invoice.status?.toLowerCase();

  return ["unpaid", "sent", "overdue"].includes(status);
}

// Identify overdue invoices using their due date
function isOverdue(invoice) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    isOutstanding(invoice) &&
    Boolean(invoice.dueDate) &&
    invoice.dueDate < today
  );
}

// Calculate a summary total in the selected currency
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

  return convertedAmounts.reduce((total, amount) => total + amount, 0);
}

// Update each summary card
async function updateSummaryCards() {
  const cards = document.querySelectorAll("[data-summary]");

  await Promise.all(
    Array.from(cards).map(async (card) => {
      const summaryType = card.dataset.summary;
      const select = card.querySelector(".home-currency");
      const amountElement = card.querySelector(".card-amount");

      if (!select || !amountElement) {
        return;
      }

      const selectedCurrency = select.value;

      amountElement.textContent = "Loading...";

      try {
        const total = await calculateSummaryTotal(
          allInvoices,
          summaryType,
          selectedCurrency
        );

        // Ignore results if the currency changed during conversion
        if (select.value !== selectedCurrency) {
          return;
        }

        amountElement.textContent = formatAmount(total, selectedCurrency);
      } catch (error) {
        amountElement.textContent = "Rate unavailable";
        console.error("Could not update summary card:", error);
      }
    })
  );
}

// Update summary when a card's currency changes
document.querySelectorAll(".home-currency").forEach((select) => {
  select.addEventListener("change", updateSummaryCards);
});

// Filter invoices based on the selected button
function getFilteredInvoices() {
  if (currentFilter === "all") {
    return allInvoices;
  }

  if (currentFilter === "unpaid") {
    return allInvoices.filter((invoice) =>
      ["unpaid", "sent"].includes(invoice.status?.toLowerCase())
    );
  }

  if (currentFilter === "overdue") {
    return allInvoices.filter(isOverdue);
  }

  return allInvoices.filter(
    (invoice) => invoice.status?.toLowerCase() === currentFilter
  );
}

// Render invoices in the table
function renderInvoices() {
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

  invoicesTableBody.innerHTML = filteredInvoices
    .map((invoice) => {
      const status = (invoice.status || "draft").toLowerCase();
      const amount = Number(invoice.amount || 0);
      const invoiceId = String(invoice.id);

      return `
        <tr>
          <td>${invoice.invoiceNumber || "N/A"}</td>
          <td>${invoice.description || invoice.clientName || "N/A"}</td>
          <td>${invoice.issueDate || "N/A"}</td>
          <td>${invoice.dueDate || "N/A"}</td>
          <td>${formatAmount(amount, invoice.currency || "KES")}</td>
          <td>
            <span class="status-badge status-${status}">
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
          <td>
            <label class="sr-only" for="status-${invoiceId}">
              Change status for ${invoice.invoiceNumber || "invoice"}
            </label>

            <select
              class="invoice-status-select"
              id="status-${invoiceId}"
              data-invoice-id="${invoiceId}"
              aria-label="Change invoice status"
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
    })
    .join("");
}

// Show feedback to the user
function showFeedback(message, type) {
  const feedback = document.querySelector("#invoice-feedback");

  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.className = `invoice-feedback ${type}`;
}

// Handle invoice status changes
async function handleStatusChange(event) {
  const select = event.target;

  if (!select.matches(".invoice-status-select")) {
    return;
  }

  const invoiceId = select.dataset.invoiceId;
  const newStatus = select.value;

  const previousInvoice = allInvoices.find(
    (invoice) => String(invoice.id) === String(invoiceId)
  );

  if (!previousInvoice) {
    showFeedback("Could not find this invoice.", "error");
    renderInvoices();
    return;
  }

  const previousStatus = (previousInvoice.status || "draft").toLowerCase();

  if (newStatus === previousStatus) {
    return;
  }

  select.disabled = true;
  showFeedback("Updating invoice status...", "success");

  try {
    // Save the new status to JSON Server using PATCH
    const updatedInvoice = await updateInvoiceStatus(invoiceId, newStatus);

    // Update local data after the API request succeeds
    previousInvoice.status = updatedInvoice.status || newStatus;

    // Re-render because the invoice may move to another filter
    renderInvoices();

    // Recalculate the summary cards
    await updateSummaryCards();

    showFeedback("Invoice status updated successfully.", "success");
  } catch (error) {
    console.error("Could not update invoice status:", error);

    // Restore the previous selection if saving fails
    select.value = previousStatus;
    showFeedback(
      "Could not update invoice status. Please check JSON Server and try again.",
      "error"
    );
  }
}

// Listen for status changes on the table
invoicesTableBody.addEventListener("change", handleStatusChange);

// Load invoices from JSON Server
async function loadInvoices() {
  try {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">Loading invoices...</td>
      </tr>
    `;

    allInvoices = await getInvoices();

    renderInvoices();
    await updateSummaryCards();
  } catch (error) {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">
          Could not load invoices. Check that JSON Server is running.
        </td>
      </tr>
    `;

    console.error("Error loading invoices:", error);
    showFeedback(
      "Could not load invoices. Please check your API connection.",
      "error"
    );
  }
}

// Handle filter button clicks
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");
    currentFilter = button.dataset.filter;

    renderInvoices();
  });
});

// Start the dashboard
loadInvoices();
