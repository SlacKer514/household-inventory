const STORAGE_KEY = "kitchenInventoryV1";
const SHOPPING_KEY = "kitchenShoppingV1";
const ACTIVITY_KEY = "kitchenActivityV1";


// ==========================================
// DATA
// ==========================================

let inventory = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

let shopping = JSON.parse(
  localStorage.getItem(SHOPPING_KEY) || "[]"
);

let activity = JSON.parse(
  localStorage.getItem(ACTIVITY_KEY) || "[]"
);


// ==========================================
// SCANNER STATE
// ==========================================

let mode = "add";

let html5QrCode = null;

let scannerRunning = false;

let lastScannedCode = null;

let lastScanTime = 0;


// ==========================================
// SAVE DATA
// ==========================================

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


// ==========================================
// SCREEN NAVIGATION
// ==========================================

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


// ==========================================
// ADD / REMOVE MODE
// ==========================================

function setMode(newMode) {

  mode = newMode;


  const addButton =
    document.getElementById("addMode");

  const removeButton =
    document.getElementById("removeMode");


  if (!addButton || !removeButton) {

    return;

  }


  if (newMode === "add") {

    addButton.className =
      "selected-add";

    removeButton.className =
      "";

  }

  else {

    addButton.className =
      "";

    removeButton.className =
      "selected-remove";

  }

}


// ==========================================
// START CAMERA
// ==========================================

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
      "The scanner area could not be found."
    );

    return;

  }


  const status =
    document.getElementById(
      "scanStatus"
    );


  status.className =
    "scan-status";


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
      // produce messages while the
      // camera searches for a barcode.
      //
      // We intentionally ignore them.

    }

  )

  .then(function() {

    scannerRunning =
      true;


    document
      .getElementById(
        "startScannerButton"
      )
      .classList
      .add("hidden");


    document
      .getElementById(
        "stopScannerButton"
      )
      .classList
      .remove("hidden");


    status.textContent =
      "Ready — point camera at barcode.";

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
      "Please make sure you allowed camera access."
    );

  });

}


// ==========================================
// BARCODE DETECTED
// ==========================================

function handleBarcodeScan(barcode) {

  const now =
    Date.now();


  // Prevent duplicate scans.
  // The same barcode cannot be processed
  // again for two seconds.

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


  processScannedBarcode(
    barcode
  );

}


// ==========================================
// PROCESS BARCODE
// ==========================================

function processScannedBarcode(
  barcode
) {

  let product =
    inventory.find(
      item =>
        item.barcode ===
        barcode
    );


  // ========================================
  // NEW PRODUCT
  // ========================================

  if (!product) {

    stopScanner();


    const name =
      prompt(

        "NEW PRODUCT\n\n" +

        "Barcode:\n" +

        barcode +

        "\n\nEnter the product name:"

      );


    if (!name) {

      startScanner();

      return;

    }


    const category =
      prompt(

        "Product category:",

        "Other"

      ) || "Other";


    const minimum =
      Number(

        prompt(

          "Minimum stock level:",

          "1"

        )

      ) || 0;


    product = {

      id:
        createID(),

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


    save();

  }


  // ========================================
  // ADD
  // ========================================

  if (mode === "add") {

    product.quantity += 1;


    logActivity(
      "Added " +
      product.name
    );


    save();


    renderHome();

    renderInventory();


    showScanConfirmation(

      "ITEM ADDED",

      product.name,

      product.quantity,

      "scan-success"

    );


    beep(
      "success"
    );

  }


  // ========================================
  // REMOVE
  // ========================================

  else {

    if (
      product.quantity > 0
    ) {

      product.quantity -= 1;


      logActivity(
        "Removed " +
        product.name
      );


      save();


      renderHome();

      renderInventory();


      showScanConfirmation(

        "ITEM REMOVED",

        product.name,

        product.quantity,

        "scan-removed"

      );


      beep(
        "remove"
      );

    }

    else {

      showScanConfirmation(

        "OUT OF STOCK",

        product.name,

        0,

        "scan-warning"

      );


      beep(
        "warning"
      );

    }

  }

}


// ==========================================
// SCAN ACKNOWLEDGEMENT
// ==========================================

function showScanConfirmation(

  action,

  productName,

  quantity,

  cssClass

) {

  const status =
    document.getElementById(
      "scanStatus"
    );


  if (!status) {

    return;

  }


  status.className =
    "scan-status " +
    cssClass;


  status.innerHTML = `

    <div
      style="
        font-size:24px;
        font-weight:900;
        margin-bottom:6px;
      "
    >

      ${escapeHTML(action)}

    </div>


    <div
      style="
        font-size:18px;
        font-weight:700;
      "
    >

      ${escapeHTML(productName)}

    </div>


    <div
      style="
        font-size:16px;
        margin-top:4px;
      "
    >

      Quantity:
      <strong>
        ${quantity}
      </strong>

    </div>

  `;


  // ========================================
  // PHONE VIBRATION
  // ========================================

  if (
    "vibrate" in navigator
  ) {

    if (
      cssClass ===
      "scan-warning"
    ) {

      navigator.vibrate(
        [100, 80, 100]
      );

    }

    else {

      navigator.vibrate(
        120
      );

    }

  }


  // ========================================
  // RETURN TO READY MESSAGE
  // ========================================

  setTimeout(function() {

    if (
      !scannerRunning
    ) {

      return;

    }


    status.className =
      "scan-status";


    status.textContent =
      "✓ Ready for next barcode.";

  }, 1800);

}


// ==========================================
// BEEP
// ==========================================

function beep(type) {

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;


    if (!AudioContext) {

      return;

    }


    const audioContext =
      new AudioContext();


    const oscillator =
      audioContext.createOscillator();


    const gain =
      audioContext.createGain();


    oscillator.connect(
      gain
    );


    gain.connect(
      audioContext.destination
    );


    let frequency =
      800;


    if (
      type === "remove"
    ) {

      frequency =
        550;

    }


    if (
      type === "warning"
    ) {

      frequency =
        300;

    }


    oscillator.frequency.value =
      frequency;


    oscillator.type =
      "sine";


    gain.gain.setValueAtTime(
      0.001,
      audioContext.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
      0.25,
      audioContext.currentTime + 0.01
    );


    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.18
    );


    oscillator.start();


    oscillator.stop(
      audioContext.currentTime +
      0.18
    );


  }

  catch (error) {

    console.log(
      "Audio acknowledgement unavailable."
    );

  }

}


// ==========================================
// STOP CAMERA
// ==========================================

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

        status.className =
          "scan-status";


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


// ==========================================
// MANUAL BARCODE
// ==========================================

function processBarcode() {

  const input =
    document.getElementById(
      "barcodeInput"
    );


  if (!input) {

    return;

  }


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


// ==========================================
// ADD PRODUCT SCREEN
// ==========================================

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


// ==========================================
// SAVE NEW PRODUCT
// ==========================================

function saveNewProduct() {

  const name =
    document.getElementById(
      "newName"
    ).value.trim();


  if (!name) {

    alert(
      "Please enter a product name."
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
        createID(),

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


// ==========================================
// CHANGE QUANTITY
// ==========================================

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


  const oldQuantity =
    product.quantity;


  product.quantity =
    Math.max(

      0,

      product.quantity +
      amount

    );


  if (
    product.quantity !==
    oldQuantity
  ) {

    if (
      amount > 0
    ) {

      logActivity(
        "Added " +
        product.name
      );

    }

    else {

      logActivity(
        "Removed " +
        product.name
      );

    }

  }


  save();


  renderHome();

  renderInventory();

}


// ==========================================
// DELETE PRODUCT
// ==========================================

function deleteProduct(
  id
) {

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


  renderHome();

  renderInventory();

}


// ==========================================
// HOME
// ==========================================

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


  const totalElement =
    document.getElementById(
      "totalItems"
    );


  const lowElement =
    document.getElementById(
      "lowItems"
    );


  if (totalElement) {

    totalElement.textContent =
      total;

  }


  if (lowElement) {

    lowElement.textContent =
      low;

  }


  const recent =
    document.getElementById(
      "recentActivity"
    );


  if (!recent) {

    return;

  }


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

          `<p>${escapeHTML(
            item
          )}</p>`

      )
      .join("");

}


// ==========================================
// INVENTORY
// ==========================================

function renderInventory() {

  const list =
    document.getElementById(
      "inventoryList"
    );


  if (!list) {

    return;

  }


  const searchElement =
    document.getElementById(
      "searchInput"
    );


  const categoryElement =
    document.getElementById(
      "categoryFilter"
    );


  const search =
    (
      searchElement?.value ||
      ""
    )
      .toLowerCase();


  const category =
    categoryElement?.value ||
    "all";


  updateCategoryFilter();


  const filtered =
    inventory.filter(
      item => {

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

      }
    );


  if (
    !filtered.length
  ) {

    list.innerHTML =
      '<div class="empty">No products found.</div>';

    return;

  }


  list.innerHTML =
    filtered
      .map(

        item => {

          const isLow =
            item.quantity <=
            item.minimum;


          return `

            <div class="product">

              <div
                style="flex:1"
              >

                <div
                  class="product-name"
                >

                  ${escapeHTML(
                    item.name
                  )}

                </div>


                <div
                  class="product-meta"
                >

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


              <div
                class="qty-buttons"
              >

                <button
                  class="secondary"
                  onclick="changeQuantity(
                    '${item.id}',
                    -1
                  )"
                >
                  −
                </button>


                <div
                  class="quantity"
                >

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

        }

      )
      .join("");

}


// ==========================================
// CATEGORY FILTER
// ==========================================

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

    ]
      .filter(Boolean)
      .sort();


  select.innerHTML =

    `<option value="all">
      All Categories
    </option>` +

    categories
      .map(

        category =>

          `<option
            value="${escapeHTML(
              category
            )}"
          >
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


// ==========================================
// SHOPPING LIST
// ==========================================

function addShoppingItem() {

  const input =
    document.getElementById(
      "shoppingInput"
    );


  if (!input) {

    return;

  }


  const name =
    input.value.trim();


  if (!name) {

    return;

  }


  shopping.push({

    id:
      createID(),

    name:
      name,

    completed:
      false

  });


  input.value =
    "";


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


  lowStock.forEach(
    item => {

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
            createID(),

          name:
            item.name,

          completed:
            false

        });

      }

    }
  );


  save();


  renderShopping();


  alert(
    "Low-stock items added to shopping list."
  );

}


function toggleShopping(
  id
) {

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


function removeShopping(
  id
) {

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


  if (!list) {

    return;

  }


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

          <div
            class="shopping-item"
          >

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


// ==========================================
// ACTIVITY LOG
// ==========================================

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


// ==========================================
// CREATE ID
// ==========================================

function createID() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (

    Date.now()
      .toString(36) +

    Math.random()
      .toString(36)
      .substring(2)

  );

}


// ==========================================
// SECURITY
// ==========================================

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


// ==========================================
// SERVICE WORKER
// ==========================================

if (
  "serviceWorker" in
  navigator
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
              "Service worker unavailable:",
              error
            );

          }
        );

    }
  );

}


// ==========================================
// START APPLICATION
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    renderHome();

    renderInventory();

    renderShopping();

    setMode("add");

  }
);
