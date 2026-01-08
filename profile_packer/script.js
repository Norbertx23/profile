document.addEventListener("DOMContentLoaded", () => {
  // State
  let items = [];
  let profiles = [];

  // DOM Elements
  const profileLengthInput = document.getElementById("profileLength");
  const profileQuantityInput = document.getElementById("profileQuantity");
  const addProfileBtn = document.getElementById("addProfileBtn");
  const profilesList = document.getElementById("profilesList");
  const profilesCount = document.getElementById("profilesCount");
  const clearProfilesBtn = document.getElementById("clearProfilesBtn");
  const profilesInput = document.getElementById("profilesInput");
  const itemNameInput = document.getElementById("itemName");
  const itemValueInput = document.getElementById("itemValue");
  const itemQuantityInput = document.getElementById("itemQuantity");
  const addItemBtn = document.getElementById("addItemBtn");
  const itemsList = document.getElementById("itemsList");
  const itemsCount = document.getElementById("itemsCount");
  const clearItemsBtn = document.getElementById("clearItemsBtn");
  const calculateBtn = document.getElementById("calculateBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  const resultsSection = document.getElementById("resultsSection");
  const resultsContainer = document.getElementById("resultsContainer");
  const remainingSpaceList = document.getElementById("remainingSpaceList");
  const unfittedItemsList = document.getElementById("unfittedItemsList");

  // Event Listeners
  addProfileBtn.addEventListener("click", addProfile);
  clearProfilesBtn.addEventListener("click", clearProfiles);
  addItemBtn.addEventListener("click", addItem);
  clearItemsBtn.addEventListener("click", clearItems);
  calculateBtn.addEventListener("click", calculateDistribution);
  exportBtn.addEventListener("click", exportToCSV);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", handleImport);

  // Allow Enter key to add profile
  profileQuantityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addProfile();
  });

  // Allow Enter key to add item
  itemValueInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addItem();
  });
  itemQuantityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addItem();
  });

  // Functions
  function addProfile() {
    const length = parseFloat(profileLengthInput.value);
    const quantity = parseInt(profileQuantityInput.value);

    if (isNaN(length) || length <= 0 || isNaN(quantity) || quantity <= 0) {
      alert("Proszę podać poprawną długość i ilość (większe od 0).");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      const profile = {
        id: Date.now() + i,
        length: length,
      };
      profiles.push(profile);
    }

    renderProfiles();

    // Reset inputs
    profileLengthInput.value = "";
    profileQuantityInput.value = "1";
    profileLengthInput.focus();
  }

  function renderProfiles() {
    profilesList.innerHTML = "";
    profilesCount.textContent = profiles.length;

    // Group profiles by length for display
    const profilesByLength = {};
    profiles.forEach((profile) => {
      if (!profilesByLength[profile.length]) {
        profilesByLength[profile.length] = 0;
      }
      profilesByLength[profile.length]++;
    });

    Object.keys(profilesByLength).forEach((length) => {
      const li = document.createElement("li");
      li.className = "item-row";
      const count = profilesByLength[length];
      li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${length}</span>
                    <span class="item-value">x${count}</span>
                </div>
                <button class="delete-btn" onclick="removeProfileByLength(${length})">&times;</button>
            `;
      li.querySelector(".delete-btn").onclick = () =>
        removeProfileByLength(length);
      profilesList.appendChild(li);
    });

    // Update hidden profilesInput with comma-separated values
    updateProfilesInput();
  }

  function updateProfilesInput() {
    const profileLengths = profiles.map((p) => p.length).join(", ");
    profilesInput.value = profileLengths;
  }

  window.removeProfileByLength = function (length) {
    profiles = profiles.filter((p) => p.length !== parseFloat(length));
    renderProfiles();
  };

  function clearProfiles() {
    if (confirm("Czy na pewno chcesz wyczyścić listę profili?")) {
      profiles = [];
      renderProfiles();
    }
  }

  // Functions
  function addItem() {
    const name = itemNameInput.value.trim();
    const value = parseFloat(itemValueInput.value);
    const quantity = parseInt(itemQuantityInput.value);

    if (
      !name ||
      isNaN(value) ||
      value <= 0 ||
      isNaN(quantity) ||
      quantity <= 0
    ) {
      alert("Proszę podać poprawną nazwę, wartość i ilość (większe od 0).");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      const item = {
        id: Date.now() + i, // Ensure unique IDs
        nazwa: quantity > 1 ? `${name}_${i + 1}` : name,
        wartosc: value,
      };
      items.push(item);
    }

    renderItems();

    // Reset inputs
    itemNameInput.value = "";
    itemValueInput.value = "";
    itemQuantityInput.value = "1";
    itemNameInput.focus();
  }

  function renderItems() {
    itemsList.innerHTML = "";
    itemsCount.textContent = items.length;

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "item-row";
      li.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.nazwa}</span>
                    <span class="item-value">${item.wartosc}</span>
                </div>
                <button class="delete-btn" onclick="removeItem(${item.id})">&times;</button>
            `;
      // Attach event listener directly to avoid global scope issues with onclick string
      li.querySelector(".delete-btn").onclick = () => removeItem(item.id);
      itemsList.appendChild(li);
    });
  }

  // Expose removeItem to be used in renderItems closure, but better to handle inside
  window.removeItem = function (id) {
    items = items.filter((item) => item.id !== id);
    renderItems();
  };

  function clearItems() {
    if (confirm("Czy na pewno chcesz wyczyścić listę?")) {
      items = [];
      renderItems();
      resultsSection.classList.add("hidden");
    }
  }

  async function calculateDistribution() {
    // 1. Parse Profiles
    const profilesStr = profilesInput.value;
    const profiles = profilesStr
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (profiles.length === 0) {
      alert("Proszę podać przynajmniej jeden profil.");
      return;
    }

    if (items.length === 0) {
      alert("Brak elementów do rozłożenia.");
      return;
    }

    // 2. Send Data to Backend
    try {
      calculateBtn.disabled = true;
      calculateBtn.textContent = "Obliczanie...";

      const response = await fetch("/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profiles: profiles,
          items: items,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 3. Render Results
      renderResults(data.results, data.unassigned);
    } catch (error) {
      console.error("Error:", error);
      alert("Wystąpił błąd podczas obliczeń. Sprawdź konsolę.");
    } finally {
      calculateBtn.disabled = false;
      calculateBtn.textContent = "Oblicz Rozkład";
    }
  }

  function renderResults(wyniki, unassignedItems) {
    resultsContainer.innerHTML = "";
    remainingSpaceList.innerHTML = "";
    unfittedItemsList.innerHTML = "";

    // Render Profiles - sort keys numerically
    const sortedKeys = Object.keys(wyniki).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

    sortedKeys.forEach((key) => {
      const data = wyniki[key];

      const card = document.createElement("div");
      card.className = "result-card";

      let itemsHtml = "";
      if (data.elementy.length > 0) {
        itemsHtml = data.elementy
          .map(
            (e) => `
                    <div class="result-item">
                        <span>${e.nazwa}</span>
                        <span style="color: #94a3b8">${e.wartosc}</span>
                    </div>
                `
          )
          .join("");
      } else {
        itemsHtml =
          '<div class="result-item" style="color: #64748b; font-style: italic;">Pusty</div>';
      }

      card.innerHTML = `
                <div class="result-header">
                    <span class="profile-name">${key.replace(/_(\d+)/, (_, n) => ` ${parseInt(n) + 1}`)}</span>
                    <span class="profile-capacity">Dł: ${data.dlugosc}</span>
                </div>
                <div class="result-items">
                    ${itemsHtml}
                </div>
            `;
      resultsContainer.appendChild(card);

      // Summary List
      const summaryLi = document.createElement("li");
      summaryLi.style.marginBottom = "0.5rem";
      summaryLi.innerHTML = `<strong>${key.replace("_", " ")}</strong>: zostało <span style="color: var(--success-color)">${data.wolne}</span>`;
      remainingSpaceList.appendChild(summaryLi);
    });

    // Render Unassigned
    if (unassignedItems.length > 0) {
      unassignedItems.forEach((item) => {
        const li = document.createElement("li");
        li.style.marginBottom = "0.5rem";
        li.innerHTML = `${item.nazwa}: <strong>${item.wartosc}</strong>`;
        unfittedItemsList.appendChild(li);
      });
    } else {
      unfittedItemsList.innerHTML =
        '<li style="color: var(--success-color)">Wszystkie elementy zostały rozmieszczone!</li>';
    }

    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  function exportToCSV() {
    if (items.length === 0 && !profilesInput.value) {
      alert("Brak danych do eksportu.");
      return;
    }

    const profilesStr = profilesInput.value.replace(/"/g, '""'); // Escape quotes
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SECTION,Nazwa,Rozmiar\n";
    csvContent += `Lista_Profili,"${profilesStr}",\n`;

    items.forEach((item) => {
      // Escape CSV unsafe characters
      const safeName = item.nazwa.replace(/"/g, '""');
      csvContent += `ITEM,"${safeName}",${item.wartosc}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "profile_packer_data.csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  }

  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      const lines = content.split("\n");

      // Reset current state
      items = [];
      let profileStringFound = "";

      lines.forEach((line) => {
        // Simple CSV parsing (handling quotes slightly)
        // Note: This is a basic parser. For robust CSV, use a library.
        // Assuming our format: SECTION,"DATA1",DATA2 or SECTION,DATA1,DATA2
        if (!line.trim()) return;

        // Naive split by comma, respecting quotes is tricky without regex or lib
        // Given we control export, we can try a regex match.
        // Matches: "quoted string" or unquoted_string
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts) return; // Skip empty or malformed

        // Clean quotes
        const cleanParts = parts.map((p) => {
          if (p.startsWith('"') && p.endsWith('"')) {
            return p.slice(1, -1).replace(/""/g, '"');
          }
          return p;
        });

        const type = cleanParts[0];

        if (type === "PROFILE_STRING") {
          if (cleanParts[1]) {
            profileStringFound = cleanParts[1];
          }
        } else if (type === "ITEM") {
          if (cleanParts.length >= 3) {
            const name = cleanParts[1];
            const val = parseFloat(cleanParts[2]);
            if (name && !isNaN(val)) {
              items.push({
                id: Date.now() + Math.random(), // New unique ID
                nazwa: name,
                wartosc: val,
              });
            }
          }
        }
      });

      // Update UI
      if (profileStringFound) {
        profilesInput.value = profileStringFound;
      }
      renderItems();
      alert("Dane zaimportowane pomyślnie.");
      importFile.value = ""; // Reset input so same file can be selected again
    };
    reader.readAsText(file);
  }
});
