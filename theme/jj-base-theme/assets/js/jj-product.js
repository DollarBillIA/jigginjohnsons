const mainImage = document.getElementById("main-image");
const qtyValue = document.getElementById("qty-value");

const stickyTitle = document.querySelector(".sticky-cart__title");
const stickyVariant = document.querySelector(".sticky-cart__variant");
const stickyPrice = document.querySelector(".sticky-cart__price");

const productTitleEl = document.querySelector(".product-title");
const productPriceEl = document.querySelector(".product-price");

function getActiveColorLabel() {
  const active = document.querySelector('.config-group[data-config="color"] .pill.is-active');
  return active ? active.textContent.trim() : "";
}

// Initialize sticky cart from main title/price and current color
if (stickyTitle && productTitleEl) {
  stickyTitle.textContent = productTitleEl.textContent.trim();
}

if (stickyPrice && productPriceEl) {
  stickyPrice.textContent = productPriceEl.textContent.trim();
}

if (stickyVariant) {
  stickyVariant.textContent = getActiveColorLabel();
}

function updateThumbVisibility(activeColor) {
  document.querySelectorAll(".gallery-thumb").forEach(t => {
    const tColor = t.getAttribute("data-color");
    if (!activeColor || tColor === activeColor) {
      t.style.display = "block";
    } else {
      t.style.display = "none";
    }
  });
}

// Thumbnail clicks
document.querySelectorAll(".gallery-thumb").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gallery-thumb")
      .forEach(x => x.classList.remove("is-active"));
    btn.classList.add("is-active");

    const src = btn.getAttribute("data-src");
    if (src) mainImage.src = src;

    const color = btn.getAttribute("data-color");
    if (color) {
      document
        .querySelectorAll('.config-group[data-config="color"] .pill')
        .forEach(p => p.classList.toggle("is-active", p.dataset.value === color));

      updateThumbVisibility(color);

      if (stickyVariant) {
        stickyVariant.textContent = btn.textContent.trim() || color;
      }
    }
  });
});

// Color pill clicks
document.querySelectorAll('.config-group[data-config="color"] .pill').forEach(pill => {
  pill.addEventListener("click", () => {
    const group = pill.closest(".config-group");

    group.querySelectorAll(".pill")
      .forEach(p => p.classList.remove("is-active"));

    pill.classList.add("is-active");

    const img = pill.dataset.img;
    if (img) mainImage.src = img;

    const color = pill.dataset.value;
    if (color) {
      updateThumbVisibility(color);

      document.querySelectorAll(".gallery-thumb").forEach(t => {
        t.classList.toggle("is-active", t.getAttribute("data-color") === color);
      });
    }

    // Sync sticky cart variant label
    if (stickyVariant) {
      stickyVariant.textContent = pill.textContent.trim();
    }
  });
});

// Non-color pill groups
document.querySelectorAll(".config-group").forEach(group => {
  if (group.dataset.config === "color") return;

  group.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
      group.querySelectorAll(".pill")
        .forEach(p => p.classList.remove("is-active"));
      pill.classList.add("is-active");
    });
  });
});

// Quantity controls
document.querySelectorAll("[data-qty-change]").forEach(btn => {
  btn.addEventListener("click", () => {
    const delta = parseInt(btn.getAttribute("data-qty-change"), 10);
    let current = parseInt(qtyValue.textContent, 10);
    current = Math.max(1, current + delta);
    qtyValue.textContent = current;
  });
});

// Arrow-based variant cycling
function changeVariantByOffset(offset) {
  const pills = Array.from(
    document.querySelectorAll('.config-group[data-config="color"] .pill')
  );
  if (!pills.length) return;

  let currentIndex = pills.findIndex(p => p.classList.contains("is-active"));
  if (currentIndex === -1) currentIndex = 0;

  const nextIndex = (currentIndex + offset + pills.length) % pills.length;
  const nextPill = pills[nextIndex];
  if (nextPill) nextPill.click();
}

const leftArrow = document.querySelector(".img-arrow--left");
const rightArrow = document.querySelector(".img-arrow--right");

if (leftArrow) leftArrow.addEventListener("click", () => changeVariantByOffset(-1));
if (rightArrow) rightArrow.addEventListener("click", () => changeVariantByOffset(1));

// Initial state
updateThumbVisibility("Color A");
