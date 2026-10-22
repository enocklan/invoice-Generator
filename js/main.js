
import { getInvoices } from "./api.js";

const currencySymbols = {
  KES: "KSh",
  USD: "$",
  EUR: "€",
  AUD: "A$"
};

// Home currency selectors on the summary cards
document.querySelectorAll(".home-currency").forEach((select) => {
  select.addEventListener("change", () => {
    const currency = select.value;
    const card = select.closest(".summary-card");
    const amountElement = card?.querySelector(".card-amount");

    if (!amountElement) return;

    const amount = Number(amountElement.dataset.amount);

    const formattedAmount = new Intl.NumberFormat("en-KE", {
      maximumFractionDigits: 2
    }).format(amount);

    amountElement.textContent =
      `${currencySymbols[currency] || currency} ${formattedAmount}`;
  });
});

// Invoice table and filters
const invoicesTableBody = document.querySelector("#invoices-table-body");
const filterButtons = document.querySelectorAll(".filter-btn");

let allInvoices = [];
let currentFilter = "all";

// Get invoices matching the selected filter
function getFilteredInvoices() {
  if (currentFilter === "all") {
    return allInvoices;
  }

  if (currentFilter === "unpaid") {
    return allInvoices.filter((invoice) =>
      ["unpaid", "sent"].includes(invoice.status?.toLowerCase())
    );
  }

  return allInvoices.filter(
    (invoice) => invoice.status?.toLowerCase() === currentFilter
  );
}

// Display invoices in the table
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
      const status = invoice.status?.toLowerCase() || "draft";
      const formattedAmount = Number(invoice.amount || 0).toLocaleString();

      return `
        <tr>
          <td>${invoice.invoiceNumber || "N/A"}</td>
          <td>${invoice.description || invoice.clientName || "N/A"}</td>
          <td>${invoice.issueDate || "N/A"}</td>
          <td>${invoice.dueDate || "N/A"}</td>
          <td>${invoice.currency || "KES"} ${formattedAmount}</td>
          <td>
            <span class="status-badge status-${status}">
              ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </td>
          <td>Actions coming soon</td>
        </tr>
      `;
    })
    .join("");
}

// Fetch invoices from JSON Server
async function loadInvoices() {
  try {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">Loading invoices...</td>
      </tr>
    `;

    allInvoices = await getInvoices();
    renderInvoices();
  } catch (error) {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">
          Could not load invoices. Check that JSON Server is running.
        </td>
      </tr>
    `;

    console.error("Error loading invoices:", error);
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

// Load invoices once when the page starts
loadInvoices();
