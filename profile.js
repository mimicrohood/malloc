let pet = null;
try { pet = JSON.parse(localStorage.getItem("malloc-pet")); } catch (_) {}
if (pet && !/^0x[0-9a-fA-F]{64}$/.test(String(pet.transaction || ""))) {
  localStorage.removeItem("malloc-pet");
  pet = null;
}

if (pet && document.querySelector("#habitatPet")) {
  const safeName = String(pet.name || "MALLOC").slice(0, 12).toUpperCase();
  document.querySelector("#habitatState").textContent = "COMPANION ONLINE";
  document.querySelector("#petOnline").textContent = "AWAKE";
  document.querySelector("#hName").textContent = safeName;
  document.querySelector("#hType").textContent = pet.signal || "UNSET";
  document.querySelector("#hMood").textContent = "CURIOUS";
  document.querySelector("#habitatPet").textContent =
    "             /\\\\       /\\\\\n" +
    "            /  \\\\_____/  \\\\\n" +
    "           |   [|]   [|]   |\n" +
    "           |       v       |\n" +
    "       +---+---------------+---+\n" +
    "       |   | " + safeName.padEnd(13, " ") + " |   |\n" +
    "       +---+---------------+---+\n\n" +
    "       status: onchain / awake_";
  const stats = document.querySelectorAll(".stat b");
  ["100", "003", "001", "001"].forEach((value, i) => stats[i].textContent = value);
  document.querySelector(".task:last-child").classList.add("done");
}

if (pet && document.querySelector("#memoryEntries")) {
  const hash = pet.transaction || "PROFILE INITIALIZED";
  document.querySelector("#memoryEntries").innerHTML =
    '<article class="memory-entry"><time>GENESIS / 001</time><div><h3>' + pet.name +
    ' CAME ONLINE</h3><p>Temperament seed: ' + pet.signal +
    '. The first companion memory was initialized.</p></div><b>CONFIRMED</b></article>' +
    '<article class="memory-entry"><time>TX RECORD</time><div><h3>ADOPTION SIGNATURE</h3><p>' +
    hash + '</p></div><b>PERMANENT</b></article>';
}
