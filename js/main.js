
const currencySymbols = {
  KES: "KSh",
  USD: "$",
  EUR: "€",
  AUD: "A$"
};

document.querySelectorAll(".home-currency").forEach((select) => {
  select.addEventListener("change", () => {
    const currency = select.value;
    const card = select.closest(".summary-card");
    const amountElement = card.querySelector(".card-amount");
    const amount = Number(amountElement.dataset.amount);

    const formattedAmount = new Intl.NumberFormat("en-KE", {
      maximumFractionDigits: 2
    }).format(amount);

    amountElement.textContent =
      `${currencySymbols[currency]} ${formattedAmount}`;
  });
});

const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove the active class from every filter.
    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active");
    });

    // Highlight the filter that was clicked.
    button.classList.add("active");
  });
});


import { getInvoices } from "./api.js";

const invoicesTableBody = document.querySelector("#invoices-table-body");

async function loadInvoices() {
  try {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">Loading invoices...</td>
      </tr>
    `;

    const invoices = await getInvoices();

    if (invoices.length === 0) {
      invoicesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-message">
            No invoices found. Create your first invoice.
          </td>
        </tr>
      `;
      return;
    }

    invoicesTableBody.innerHTML = invoices
      .map(
        (invoice) => `
          <tr>
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.description || invoice.clientName}</td>
            <td>${invoice.issueDate}</td>
            <td>${invoice.dueDate}</td>
            <td>${invoice.currency || "KES"} ${Number(invoice.amount).toLocaleString()}</td>
            <td>${invoice.status}</td>
            <td>Actions coming soon</td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    invoicesTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="table-message">
          Could not load invoices. Check that JSON Server is running.
        </td>
      </tr>
    `;

    console.error(error);
  }
}

loadInvoices();


