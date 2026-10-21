
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

