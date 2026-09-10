const caValue = document.querySelector("#caValue");
const copyButton = document.querySelector("#copyCA");
const siteToast = document.querySelector("#toast");
const officialCA = window.MALLOC_CONFIG && window.MALLOC_CONFIG.contractAddress;

if (caValue && officialCA) {
  caValue.textContent = officialCA;
  copyButton.disabled = false;
  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(officialCA);
    siteToast.textContent = "> CONTRACT ADDRESS COPIED";
    siteToast.classList.add("show");
    setTimeout(() => siteToast.classList.remove("show"), 2200);
  });
}
