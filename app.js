// ==========================================
// HOUSEHOLD INVENTORY APP
// ==========================================

const STORAGE_KEY = "kitchenInventoryV1";
const ACTIVITY_KEY = "kitchenActivityV1";
const SHOPPING_KEY = "kitchenShoppingV1";

let inventory = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

let activity = JSON.parse(
  localStorage.getItem(ACTIVITY_KEY) || "[]"
);

let shopping = JSON.parse(
  localStorage.getItem(SHOPPING_KEY) || "[]"
);


// ==========================================
// SCANNER VARIABLES
// ==========================================

let scanner = null;

let scannerRunning = false;

let mode = "add";

let lastBarcode = "";

let lastBarcodeTime = 0;


// ==========================================
// SAVE
// ==========================================

function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(inventory)
  );

  localStorage.setItem(
    ACTIVITY_KEY,
    JSON.stringify(activity)
  );

  localStorage.setItem(
    SHOPPING_KEY,
    JSON.stringify(shopping)
  );

}


// ==========================================
// NAVIGATION
// ==========================================

function showScreen(screenName) {

  if (
    screenName !== "scan" &&
    scannerRunning
  ) {

    stopScanner();

  }


  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove(
        "active"
      );

    });


  const screen =
    document.getElementById(
      screenName
    );


  if (screen) {

    screen.classList.add(
      "active"
    );

  }


  document
    .querySelectorAll(
      ".bottom-nav button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.screen ===
          screenName
      );

    });


  if (
    screenName === "home"
  ) {

    renderHome();

  }


  if (
    screenName === "inventory"
  ) {

    renderInventory();

  }


  if (
    screenName === "shopping"
  ) {

    renderShopping();

  }

}


// ==========================================
// ADD / REMOVE
// ==========================================

function setMode(newMode) {

  mode = newMode;


  const addButton =
    document.getElementById(
      "addMode"
    );

  const removeButton =
    document.getElementById(
      "removeMode"
    );


  if (
    !addButton ||
    !removeButton
  ) {

    return;

  }


  addButton.className = "";

  removeButton.className = "";


  if (
    newMode === "add"
  ) {

    addButton.className =
      "selected-add";

  }

  else {

    removeButton.className =
      "selected-remove";

  }

}


// ==========================================
// START SCANNER
// ==========================================

function startScanner() {

  if (
    scannerRunning
  ) {

    return;

  }


  if (
    typeof Html5Qrcode ===
    "undefined"
  ) {

    alert(
      "Barcode scanner library did not load."
    );

    return;

  }


  const reader =
    document.getElementById(
      "reader"
    );


  if (!reader) {

    alert(
      "Scanner area not found."
    );

    return;

  }


  setScanStatus(
    "Starting camera..."
  );


  scanner =
    new Html5Qrcode(
      "reader"
    );


  const config = {

    fps: 10,

    qrbox: {
      width: 280,
      height: 140
    }

  };


  scanner.start(

    {
      facingMode:
        "environment"
    },

    config,

    function(decodedText) {

      console.log(
        "BARCODE DETECTED:",
        decodedText
      );


      handleBarcode(
        decodedText
      );

    },

    function(errorMessage) {

      // Ignore normal scanning errors.

    }

  )

  .then(function() {

    scannerRunning =
      true;


    document
      .getElementById(
        "startScannerButton"
      )
      ?.classList
      .add("hidden");


    document
      .getElementById(
        "stopScannerButton"
      )
      ?.classList
      .remove("hidden");


    setScanStatus(
      "Ready — point the camera at a barcode."
    );

  })

  .catch(function(error) {

    console.error(
      error
    );


    setScanStatus(
      "Camera could not start."
    );


    alert(
      "Camera could not start. Please check camera permissions."
    );

  });

}


// ==========================================
// BARCODE DETECTED
// ==========================================

function handleBarcode(
  barcode
) {

  const now =
    Date.now();


  // Prevent the same barcode
  // from being processed repeatedly.

  if (

    barcode ===
      lastBarcode &&

    now -
      lastBarcodeTime <
      2000

  ) {

    return;

  }


  lastBarcode =
    barcode;

  lastBarcodeTime =
    now;


  processBarcodeScan(
    barcode
  );

}


// ==========================================
// PROCESS SCAN
// ==========================================

function processBarcodeScan(
  barcode
) {

  console.log(
    "PROCESSING BARCODE:",
    barcode
  );


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
        "NEW PRODUCT\n\nBarcode: " +
        barcode +
        "\n\nEnter product name:"
      );


    if (!name) {

      startScanner();

      return;

    }


    product = {

      id:
        createID(),

      barcode:
        barcode,

      name:
        name.trim(),

      category:
        "Other",

      quantity:
        0,

      minimum:
        1

    };


    inventory.push(
      product
    );


    saveData();

  }


  // ========================================
  // ADD
  // ========================================

  if (
    mode === "add"
  ) {

    product.quantity =
      Number(product.quantity) +
      1;


    logActivity(
      "Added " +
      product.name
    );


    saveData();


    // THIS IS THE IMPORTANT PART
    // SHOW ACKNOWLEDGEMENT IMMEDIATELY

    showAcknowledgement(

      "ADDED",

      product.name,

      product.quantity,

      "added"

    );


    beep();


    vibrate();


    renderHome();

    renderInventory();

  }


  // ========================================
  // REMOVE
  // ========================================

  else {

    if (
      product.quantity <= 0
    ) {

      showAcknowledgement(

        "OUT OF STOCK",

        product.name,

        0,

        "warning"

      );


      beepWarning();


      vibrateWarning();


      return;

    }


    product.quantity =
      Number(product.quantity) -
      1;


    logActivity(
      "Removed " +
      product.name
    );


    saveData();


    showAcknowledgement(

      "REMOVED",

      product.name,

      product.quantity,

      "removed"

    );


    beepRemove();


    vibrate();


    renderHome();

    renderInventory();

  }

}


// ==========================================
// ACKNOWLEDGEMENT
// ==========================================

function showAcknowledgement(

  action,

  productName,

  quantity,

  type

) {

  console.log(
    "SHOW ACKNOWLEDGEMENT:",
    action,
    productName,
    quantity
  );


  const box =
    document.getElementById(
      "scanConfirmation"
    );


  if (!box) {

    console.error(
      "scanConfirmation element NOT FOUND"
    );


    // Emergency fallback

    alert(

      action +
      "\n\n" +
      productName +
      "\n\nQuantity: " +
      quantity

    );


    return;

  }


  box.className =
    "scan-confirmation " +
    type;


  box.innerHTML = `

    <div class="confirmation-action">

      ${
        type === "added"
          ? "✅ ITEM ADDED"
          : ""
      }

      ${
        type === "removed"
          ? "🔴 ITEM REMOVED"
          : ""
      }

      ${
        type === "warning"
          ? "⚠️ OUT OF STOCK"
          : ""
      }

    </div>


    <div class="confirmation-product">

      ${escapeHTML(
        productName
      )}

    </div>


    <div class="confirmation-quantity">

      Quantity:

      <strong>
        ${quantity}
      </strong>

    </div>

  `;


  // Make sure it is visible.

  box.classList.remove(
    "hidden"
  );


  // Scroll acknowledgement
  // into view on phone.

  box.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });


  // Leave acknowledgement
  // visible for 2.5 seconds.

  setTimeout(
    function() {

      box.classList.add(
        "hidden"
      );

    },

    2500

  );

}


// ==========================================
// STATUS
// ==========================================

function setScanStatus(
  message
) {

  const status =
    document.getElementById(
      "scanStatus"
    );


  if (status) {

    status.textContent =
      message;

  }

}


// ==========================================
// BEEP - ADD
// ==========================================

function beep() {

  playTone(
    850,
    0.18
  );

}


// ==========================================
// BEEP - REMOVE
// ==========================================

function beepRemove() {

  playTone(
    550,
    0.18
  );

}


// ==========================================
// BEEP - WARNING
// ==========================================

function beepWarning() {

  playTone(
    300,
    0.3
  );

}


// ==========================================
// PLAY TONE
// ==========================================

function playTone(
  frequency,
  duration
) {

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;


    if (!AudioContext) {

      return;

    }


    const context =
      new AudioContext();


    const oscillator =
      context.createOscillator();


    const gain =
      context.createGain();


    oscillator.connect(
      gain
    );


    gain.connect(
      context.destination
    );


    oscillator.frequency.value =
      frequency;


    oscillator.type =
      "sine";


    gain.gain.setValueAtTime(
      0.001,
      context.currentTime
    );


    gain.gain.exponentialRampToValueAtTime(
      0.25,
      context.currentTime +
        0.01
    );


    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime +
        duration
    );


    oscillator.start();


    oscillator.stop(
      context.currentTime +
        duration
    );

  }

  catch(error) {

    console.log(
      "Audio unavailable"
    );

  }

}


// ==========================================
// VIBRATION
// ==========================================

function vibrate() {

  if (
    navigator.vibrate
  ) {

    navigator.vibrate(
      120
    );

  }

}


function vibrateWarning() {

  if (
    navigator.vibrate
  ) {

    navigator.vibrate(
      [
        100,
        80,
        100
      ]
    );

  }

}


// ==========================================
// STOP SCANNER
// ==========================================

function stopScanner() {

  if (
    !scanner ||
    !scannerRunning
  ) {

    return;

  }


  scanner
    .stop()

    .then(function() {

      scanner.clear();


      scannerRunning =
        false;


      document
        .getElementById(
          "startScannerButton"
        )
        ?.classList
        .remove("hidden");


      document
        .getElementById(
          "stopScannerButton"
        )
        ?.classList
        .add("hidden");


      setScanStatus(
        "Camera is off."
      );

    })

    .catch(function(error) {

      console.log(
        "Scanner stop error:",
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
      "Enter a barcode first."
    );

    return;

  }


  handleBarcode(
    barcode
  );


  input.value = "";

}


// ==========================================
// ADD PRODUCT
// ==========================================

function openAddProduct() {

  showScreen(
    "addProduct"
  );


}


// ==========================================
// SAVE PRODUCT
// ==========================================

function saveNewProduct() {

  const name =
    document.getElementById(
      "newName"
    )?.value.trim();


  if (!name) {

    alert(
      "Please enter a product name."
    );

    return;

  }


  const barcode =
    document.getElementById(
      "newBarcode"
    )?.value.trim() ||
    "";


  const category =
    document.getElementById(
      "newCategory"
    )?.value ||
    "Other";


  const quantity =
    Number(
      document.getElementById(
        "newQuantity"
      )?.value
    ) || 0;


  const minimum =
    Number(
      document.getElementById(
        "newMinimum"
      )?.value
    ) || 1;


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
    name
  );


  saveData();


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


  product.quantity =
    Math.max(
      0,
      Number(product.quantity) +
      amount
    );


  logActivity(

    amount > 0
      ? "Added " + product.name
      : "Removed " + product.name

  );


  saveData();


  renderHome();

  renderInventory();

}


// ==========================================
// DELETE
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
      "?"
    )
  ) {

    return;

  }


  inventory =
    inventory.filter(
      item =>
        item.id !== id
    );


  saveData();


  renderInventory();

  renderHome();

}


// ==========================================
// HOME
// ==========================================

function renderHome() {

  const total =
    inventory.reduce(

      function(sum, item) {

        return (
          sum +
          Number(item.quantity)
        );

      },

      0

    );


  const low =
    inventory.filter(

      item =>
        Number(item.quantity) <=
        Number(item.minimum)

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
    activity.length === 0
  ) {

    recent.innerHTML =
      '<div class="empty">No activity yet.</div>';

    return;

  }


  recent.innerHTML =
    activity
      .slice(0, 10)
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


  const search =
    (
      document.getElementById(
        "searchInput"
      )?.value ||
      ""
    )
      .toLowerCase();


  const category =
    document.getElementById(
      "categoryFilter"
    )?.value ||
    "all";


  const filtered =
    inventory.filter(
      item => {

        const matchesName =
          item.name
            .toLowerCase()
            .includes(
              search
            );


        const matchesCategory =

          category ===
            "all" ||

          item.category ===
            category;


        return (
          matchesName &&
          matchesCategory
        );

      }
    );


  if (
    filtered.length === 0
  ) {

    list.innerHTML =
      '<div class="empty">No products found.</div>';

    return;

  }


  list.innerHTML =
    filtered
      .map(
        item => {

          const low =
            Number(item.quantity) <=
            Number(item.minimum);


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
                    low
                      ? ' • <span class="low">LOW</span>'
                      : ""
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

        }
      )
      .join("");

}


// ==========================================
// SHOPPING
// ==========================================

function addShoppingItem() {

  const input =
    document.getElementById(
      "shoppingInput"
    );


  const name =
    input?.value.trim();


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


  saveData();

  renderShopping();

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


  saveData();

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


  saveData();

  renderShopping();

}


function addLowStockToShopping() {

  inventory
    .filter(
      item =>
        Number(item.quantity) <=
        Number(item.minimum)
    )
    .forEach(
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


  saveData();

  renderShopping();


  alert(
    "Low-stock items added."
  );

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
    shopping.length === 0
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


            <div style="flex:1">

              ${
                item.completed
                  ? `<s>${escapeHTML(
                      item.name
                    )}</s>`
                  : escapeHTML(
                      item.name
                    )
              }

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
// ACTIVITY
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
      50
    );

}


// ==========================================
// ID
// ==========================================

function createID() {

  return (
    Date.now()
      .toString(36) +
    Math.random()
      .toString(36)
      .substring(2)
  );

}


// ==========================================
// ESCAPE HTML
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
// START APP
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
