
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
