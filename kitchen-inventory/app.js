const STORAGE_KEY = "kitchenInventoryV1";
const SHOPPING_KEY = "kitchenShoppingV1";
const ACTIVITY_KEY = "kitchenActivityV1";

let inventory = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

let shopping = JSON.parse(
  localStorage.getItem(SHOPPING_KEY) || "[]"
);

let activity = JSON.parse(
  localStorage.getItem(ACTIVITY_KEY) || "[]"
);

let mode = "add";

let html5QrCode = null;
let scannerRunning = false;
let lastScannedCode = null;
let lastScanTime = 0;


// ===============================
// SAVE DATA
// ===============================

function save() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(inventory)
  );

  localStorage.setItem(
    SHOPPING_KEY,
    JSON.stringify(shopping)
  );

  localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify(activity)
  );

}


// ===============================
// SCREEN NAVIGATION
// ===============================

function showScreen(id) {

  if (
    id !== "scan" &&
    scannerRunning
  ) {
    stopScanner();
  }


  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  const screen =
    document.getElementById(id);


  if (screen) {
    screen.classList.add("active");
  }


  document
    .querySelectorAll(".bottom-nav button")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.screen === id
      );

    });


  if (id === "home") {
    renderHome();
  }


  if (id === "inventory") {
    renderInventory();
  }


  if (id === "shopping") {
    renderShopping();
  }

}


// ===============================
// ADD / REMOVE MODE
// ===============================

function setMode(newMode) {

  mode = newMode;


  const addButton =
    document.getElementById("addMode");

  const removeButton =
    document.getElementById("removeMode");


  if (newMode === "add") {

    addButton.className =
      "selected-add";

    removeButton.className = "";

  }

  else {

    addButton.className = "";

    removeButton.className =
      "selected-remove";

  }

}


// ===============================
// CAMERA SCANNER
// ===============================

function startScanner() {

  if (scannerRunning) {
    return;
  }


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    alert(
      "The barcode scanner library did not load. " +
      "Please refresh the page and try again."
    );

    return;

  }


  const reader =
    document.getElementById("reader");


  if (!reader) {

    alert(
      "Scanner area could not be found."
    );

    return;

  }


  const status =
    document.getElementById(
      "scanStatus"
    );


  status.textContent =
    "Starting camera...";


  html5QrCode =
    new Html5Qrcode("reader");


  const config = {

    fps: 10,

    qrbox: {
      width: 280,
      height: 140
    },

    aspectRatio: 1.777778

  };


  html5QrCode.start(

    {
      facingMode: "environment"
    },

    config,

    function(decodedText) {

      handleBarcodeScan(
        decodedText
      );

    },

    function(errorMessage) {

      // Normal scanning attempts
      // produce errors while looking
      // for a barcode.
      //
      // We intentionally ignore them.

    }

  )

  .then(function() {

    scannerRunning = true;


    document
      .getElementById(
        "startScannerButton"
      )
      .classList.add("hidden");


    document
      .getElementById(
        "stopScannerButton"
      )
      .classList.remove("hidden");


    status.textContent =
      "Point your camera at a grocery barcode.";

  })


  .catch(function(error) {

    console.error(
      "Camera error:",
      error
    );


    status.textContent =
      "Camera could not start.";


    alert(
      "The camera could not be started.\n\n" +
      "Make sure you allowed camera access " +
      "when your phone asked."
    );

  });

}


// ===============================
// BARCODE DETECTED
// ===============================

function handleBarcodeScan(
  barcode
) {

  const now =
    Date.now();


  if (

    barcode ===
      lastScannedCode &&

    now -
      lastScanTime <
      2000

  ) {

    return;

  }


  lastScannedCode =
    barcode;

  lastScanTime =
    now;


  const status =
    document.getElementById(
      "scanStatus"
    );


  status.textContent =
    "Barcode found: " +
    barcode;


  processScannedBarcode(
    barcode
  );

}


// ===============================
// PROCESS SCANNED PRODUCT
// ===============================

function processScannedBarcode(
  barcode
) {

  let product =
    inventory.find(
      item =>
        item.barcode ===
        barcode
    );


  // =============================
  // NEW PRODUCT
  // =============================

  if (!product) {

    stopScanner();


    const name =
      prompt(

        "New barcode found:\n\n" +

        barcode +

        "\n\nWhat is the product name?"

      );


    if (!name) {

      return;

    }


    const category =
      prompt(

        "What category is this product?",

        "Other"

      ) || "Other";


    const minimum =
      Number(

        prompt(

          "Minimum stock level?",

          "1"

        )

      ) || 0;


    product = {

      id:
        crypto.randomUUID(),

      barcode:
        barcode,

      name:
        name.trim(),

      category:
        category.trim(),

      quantity:
        0,

      minimum:
        minimum

    };


    inventory.push(
      product
    );

  }


  // =============================
  // ADD
  // =============================

  if (mode === "add") {

    product.quantity += 1;


    logActivity(

      "Added " +
      product.name

    );

  }


  // =============================
  // REMOVE
  // =============================

  else {

    if (
      product.quantity > 0
    ) {

      product.quantity -= 1;


      logActivity(

        "Removed " +
        product.name

      );

    }

    else {

      alert(

        product.name +
        " is already at 0."

      );

    }

  }


  save();


  renderHome();

  renderInventory();


  const status =
    document.getElementById(
      "scanStatus"
    );


  if (status) {

    status.textContent =

      product.name +

      ": " +

      product.quantity +

      " in stock";

  }

}


// ===============================
// STOP CAMERA
// ===============================

function stopScanner() {

  if (
    !html5QrCode ||
    !scannerRunning
  ) {

    return;

  }


  html5QrCode

    .stop()

    .then(function() {

      html5QrCode.clear();


      scannerRunning =
        false;


      const startButton =
        document.getElementById(
          "startScannerButton"
        );


      const stopButton =
        document.getElementById(
          "stopScannerButton"
        );


      if (startButton) {

        startButton
          .classList
          .remove("hidden");

      }


      if (stopButton) {

        stopButton
          .classList
          .add("hidden");

      }


      const status =
        document.getElementById(
          "scanStatus"
        );


      if (status) {

        status.textContent =
          "Camera is off.";

      }

    })


    .catch(function(error) {

      console.error(
        "Error stopping scanner:",
        error
      );

    });

}


// ===============================
// MANUAL BARCODE
// ===============================

function processBarcode() {

  const input =
    document.getElementById(
      "barcodeInput"
    );


  const barcode =
    input.value.trim();


  if (!barcode) {

    alert(
      "Please enter a barcode."
    );

    return;

  }


  processScannedBarcode(
    barcode
  );


  input.value = "";

}


// ===============================
// QUICK ADD PRODUCT
// ===============================

function openAddProduct() {

  document.getElementById(
    "newName"
  ).value = "";


  document.getElementById(
    "newBarcode"
  ).value = "";


  document.getElementById(
    "newQuantity"
  ).value = 1;


  document.getElementById(
    "newMinimum"
  ).value = 1;


  showScreen(
    "addProduct"
  );

}


// ===============================
// SAVE NEW PRODUCT
// ===============================

function saveNewProduct() {

  const name =
    document.getElementById(
      "newName"
    ).value.trim();


  if (!name) {

    alert(
      "Enter a product name."
    );

    return;

  }


  const barcode =
    document.getElementById(
      "newBarcode"
    ).value.trim();


  const category =
    document.getElementById(
      "newCategory"
    ).value;


  const quantity =
    Number(

      document.getElementById(
        "newQuantity"
      ).value

    ) || 0;


  const minimum =
    Number(

      document.getElementById(
        "newMinimum"
      ).value

    ) || 0;


  const existing =
    barcode

      ? inventory.find(
          item =>
            item.barcode ===
            barcode
        )

      : null;


  if (existing) {

    existing.quantity +=
      quantity;

    existing.minimum =
      minimum;


    logActivity(

      "Added " +
      quantity +
      " " +
      existing.name

    );

  }

  else {

    inventory.push({

      id:
        crypto.randomUUID(),

      barcode:
        barcode,

      name:
        name,

      category:
        category,

      quantity:
        quantity,

      minimum:
        minimum

    });


    logActivity(

      "Added " +
      quantity +
      " " +
      name

    );

  }


  save();


  showScreen(
    "inventory"
  );

}


// ===============================
// CHANGE QUANTITY
// ===============================

function changeQuantity(
  id,
  amount
) {

  const product =
    inventory.find(
      item =>
        item.id === id
    );


  if (!product) {
    return;
  }


  product.quantity =
    Math.max(

      0,

      product.quantity +
      amount

    );


  logActivity(

    amount > 0

      ? "Added " +
        product.name

      : "Removed " +
        product.name

  );


  save();


  renderHome();

  renderInventory();

}


// ===============================
// DELETE PRODUCT
// ===============================

function deleteProduct(id) {

  const product =
    inventory.find(
      item =>
        item.id === id
    );


  if (!product) {
    return;
  }


  if (
    !confirm(
      "Delete " +
      product.name +
      " from inventory?"
    )
  ) {

    return;

  }


  inventory =
    inventory.filter(
      item =>
        item.id !== id
    );


  save();


  renderInventory();

  renderHome();

}


// ===============================
// HOME
// ===============================

function renderHome() {

  const total =
    inventory.reduce(

      (sum, item) =>
        sum + item.quantity,

      0

    );


  const low =
    inventory.filter(

      item =>
        item.quantity <=
        item.minimum

    ).length;


  document.getElementById(
    "totalItems"
  ).textContent =
    total;


  document.getElementById(
    "lowItems"
  ).textContent =
    low;


  const recent =
    document.getElementById(
      "recentActivity"
    );


  if (
    !activity.length
  ) {

    recent.innerHTML =
      '<div class="empty">No activity yet.</div>';

    return;

  }


  recent.innerHTML =
    activity
      .slice(0, 8)
      .map(
        item =>
          `<p>${escapeHTML(item)}</p>`
      )
      .join("");

}


// ===============================
// INVENTORY
// ===============================

function renderInventory() {

  const list =
    document.getElementById(
      "inventoryList"
    );


  const search =
    (
      document.getElementById(
        "searchInput"
      )?.value || ""
    ).toLowerCase();


  const category =
    document.getElementById(
      "categoryFilter"
    )?.value || "all";


  updateCategoryFilter();


  const filtered =
    inventory.filter(item => {

      const matchesSearch =

        item.name
          .toLowerCase()
          .includes(search);


      const matchesCategory =

        category === "all" ||

        item.category ===
          category;


      return (
        matchesSearch &&
        matchesCategory
      );

    });


  if (
    !filtered.length
  ) {

    list.innerHTML =
      '<div class="empty">No products found.</div>';

    return;

  }


  list.innerHTML =
    filtered
      .map(item => {

        const isLow =
          item.quantity <=
          item.minimum;


        return `

          <div class="product">

            <div style="flex:1">

              <div class="product-name">

                ${escapeHTML(
                  item.name
                )}

              </div>

              <div class="product-meta">

                ${escapeHTML(
                  item.category
                )}

                ${
                  isLow
                    ? ' • <span class="low">LOW</span>'
                    : ''
                }

              </div>

            </div>


            <div class="qty-buttons">

              <button
                class="secondary"
                onclick="changeQuantity(
                  '${item.id}',
                  -1
                )"
              >
                −
              </button>


              <div class="quantity">

                ${item.quantity}

              </div>


              <button
                class="primary"
                onclick="changeQuantity(
                  '${item.id}',
                  1
                )"
              >
                +
              </button>


              <button
                class="secondary"
                onclick="deleteProduct(
                  '${item.id}'
                )"
              >
                🗑
              </button>

            </div>

          </div>

        `;

      })
      .join("");

}


// ===============================
// CATEGORY FILTER
// ===============================

function updateCategoryFilter() {

  const select =
    document.getElementById(
      "categoryFilter"
    );


  if (!select) {
    return;
  }


  const current =
    select.value;


  const categories =
    [
      ...new Set(

        inventory.map(
          item =>
            item.category
        )

      )

    ].sort();


  select.innerHTML =

    '<option value="all">' +
    'All Categories' +
    '</option>' +

    categories
      .map(

        category =>

          `<option value="${escapeHTML(
            category
          )}">

            ${escapeHTML(
              category
            )}

          </option>`

      )
      .join("");


  if (
    categories.includes(
      current
    )
  ) {

    select.value =
      current;

  }

}


// ===============================
// SHOPPING LIST
// ===============================

function addShoppingItem() {

  const input =
    document.getElementById(
      "shoppingInput"
    );


  const name =
    input.value.trim();


  if (!name) {
    return;
  }


  shopping.push({

    id:
      crypto.randomUUID(),

    name:
      name,

    completed:
      false

  });


  input.value = "";


  save();


  renderShopping();

}


function addLowStockToShopping() {

  const lowStock =
    inventory.filter(

      item =>
        item.quantity <=
        item.minimum

    );


  lowStock.forEach(item => {

    const exists =
      shopping.some(

        shop =>

          shop.name
            .toLowerCase() ===
          item.name
            .toLowerCase() &&

          !shop.completed

      );


    if (!exists) {

      shopping.push({

        id:
          crypto.randomUUID(),

        name:
          item.name,

        completed:
          false

      });

    }

  });


  save();


  renderShopping();


  alert(
    "Low-stock items added to shopping list."
  );

}


function toggleShopping(id) {

  const item =
    shopping.find(
      item =>
        item.id === id
    );


  if (!item) {
    return;
  }


  item.completed =
    !item.completed;


  save();


  renderShopping();

}


function removeShopping(id) {

  shopping =
    shopping.filter(
      item =>
        item.id !== id
    );


  save();


  renderShopping();

}


function renderShopping() {

  const list =
    document.getElementById(
      "shoppingList"
    );


  if (
    !shopping.length
  ) {

    list.innerHTML =
      '<div class="empty">Shopping list is empty.</div>';

    return;

  }


  list.innerHTML =
    shopping
      .map(

        item => `

          <div class="shopping-item">

            <input
              type="checkbox"

              ${
                item.completed
                  ? "checked"
                  : ""
              }

              onchange="toggleShopping(
                '${item.id}'
              )"
            >


            <div
              style="
                flex:1;
                ${
                  item.completed
                    ? "text-decoration:line-through;color:#888"
                    : ""
                }
              "
            >

              ${escapeHTML(
                item.name
              )}

            </div>


            <button
              class="secondary"
              onclick="removeShopping(
                '${item.id}'
              )"
            >
              ✕
            </button>

          </div>

        `

      )
      .join("");

}


// ===============================
// ACTIVITY
// ===============================

function logActivity(
  message
) {

  const time =
    new Date()
      .toLocaleTimeString(
        [],
        {
          hour: "numeric",
          minute: "2-digit"
        }
      );


  activity.unshift(

    time +
    " — " +
    message

  );


  activity =
    activity.slice(
      0,
      30
    );

}


// ===============================
// SECURITY
// ===============================

function escapeHTML(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// ===============================
// SERVICE WORKER
// ===============================

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register(
          "service-worker.js"
        )

        .catch(
          error => {

            console.log(
              "Service worker registration failed:",
              error
            );

          }
        );

    }
  );

}


// ===============================
// START APP
// ===============================

renderHome();

renderInventory();

renderShopping();
