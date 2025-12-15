/**
 * JJ Product page: move Availability + Custom Fields (e.g., Pack Quantity)
 * + Write a Review directly under the Add to Cart area (JJ only).
 *
 * Important: BigCommerce often re-renders/replaces product header DOM after
 * option/variant changes. So we:
 *  - apply once on load
 *  - re-apply after relevant DOM mutations
 *  - re-apply after option changes (debounced)
 */

function debounce(fn, wait = 60) {
  let t = null;
  return function debounced(...args) {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn.apply(this, args), wait);
  };
}

function ensureTarget(jjRoot, addToCartWrapper) {
  let target = jjRoot.querySelector(".jj-below-atc");
  if (!target) {
    target = document.createElement("div");
    target.className = "jj-below-atc";
    addToCartWrapper.insertAdjacentElement("afterend", target);
  }
  return target;
}

function findAddToCartWrapper(jjRoot) {
  return (
    jjRoot.querySelector("#add-to-cart-wrapper") ||
    jjRoot.querySelector(".add-to-cart-wrapper") ||
    jjRoot.querySelector("#form-action-addToCart")?.closest(".add-to-cart-wrapper") ||
    jjRoot.querySelector("#form-action-addToCart")?.closest(".productView-options")
  );
}

/**
 * Build or reuse a JJ info container inside .jj-below-atc.
 * We do NOT rely on moving a theme-specific wrapper (.productView-info),
 * because on this theme the Availability row is a dt/dd pair.
 */
function ensureInfoContainer(target) {
  let box = target.querySelector(".jj-atc-info");
  if (!box) {
    box = document.createElement("div");
    box.className = "jj-atc-info";
    target.appendChild(box);
  }
  return box;
}

/**
 * Availability is typically rendered as:
 *   <dt class="productView-info-name">Availability:</dt>
 *   <dd class="productView-info-value">Ships with tracking...</dd>
 *
 * We move ONLY the Availability row (dt+dd) into JJ area.
 */
function moveAvailabilityRow(jjRoot, infoBox) {
  const productHeader = jjRoot.querySelector(".productView-product");
  if (!productHeader) return;

  // Look for the dt containing "Availability"
  const dts = productHeader.querySelectorAll("dt.productView-info-name");
  let availabilityDt = null;

  dts.forEach((dt) => {
    const txt = (dt.textContent || "").trim().toLowerCase();
    if (txt.startsWith("availability")) availabilityDt = dt;
  });

  if (!availabilityDt) return;

  const availabilityDd = availabilityDt.nextElementSibling;
  if (!availabilityDd || availabilityDd.tagName.toLowerCase() !== "dd") return;

  // Avoid re-moving if it's already in our JJ area
  if (infoBox.contains(availabilityDt) || infoBox.contains(availabilityDd)) return;

  // Create a dl to preserve semantics/spacing (and keep dt/dd paired)
  let dl = infoBox.querySelector("dl.jj-atc-dl");
  if (!dl) {
    dl = document.createElement("dl");
    dl.className = "jj-atc-dl";
    infoBox.appendChild(dl);
  }

  dl.appendChild(availabilityDt);
  dl.appendChild(availabilityDd);
}

/**
 * Custom fields are rendered as:
 *   <div class="productView-customFields">
 *     <div class="productView-customField">
 *       <dt class="productView-info-name">Pack Quantity</dt>
 *       <dd class="productView-info-value">Pack contains 16 baits</dd>
 *     </div>
 *     ... any number ...
 *   </div>
 *
 * We move the entire .productView-customFields block.
 */
function moveCustomFields(jjRoot, infoBox) {
  const customFields = jjRoot.querySelector(".productView-customFields");
  if (!customFields) return;

  if (infoBox.contains(customFields)) return; // already moved
  infoBox.appendChild(customFields);
}

/**
 * Move Write a Review link under ATC as well (JJ only).
 */
function moveWriteReview(jjRoot, target) {
  const productHeader = jjRoot.querySelector(".productView-product");
  if (!productHeader) return;

  const writeReviewLink =
    productHeader.querySelector(".productView-reviewLink") ||
    productHeader.querySelector("a[href*='#write_review']") ||
    productHeader.querySelector("a[href*='write_review']");

  if (!writeReviewLink) return;
  if (target.contains(writeReviewLink)) return;

  target.appendChild(writeReviewLink);
}

function applyMoves() {
  const jjRoot = document.querySelector(".jj-product-page");
  if (!jjRoot) return;

  const addToCartWrapper = findAddToCartWrapper(jjRoot);
  if (!addToCartWrapper) return;

  const target = ensureTarget(jjRoot, addToCartWrapper);
  const infoBox = ensureInfoContainer(target);

  // Apply in stable order:
  // 1) Availability row
  // 2) Custom Fields block (Pack Quantity + any others)
  // 3) Write a Review link
  moveAvailabilityRow(jjRoot, infoBox);
  moveCustomFields(jjRoot, infoBox);
  moveWriteReview(jjRoot, target);
}

const applyMovesDebounced = debounce(applyMoves, 80);

export default function jjProductMoves() {
  const jjRoot = document.querySelector(".jj-product-page");
  if (!jjRoot) return;

  // 1) Run once ASAP (after DOM has painted)
  applyMoves();

  // 2) Re-run after option/variant changes (BC updates can happen after this)
  jjRoot.addEventListener("change", (e) => {
    // any change inside product options should trigger a re-apply
    const inOptions = e.target && e.target.closest && e.target.closest(".productView-options");
    if (inOptions) applyMovesDebounced();
  });

  // 3) Observe product header area for replacements (BC often swaps this DOM)
  const header = jjRoot.querySelector(".productView-product") || jjRoot;
  const obs = new MutationObserver(() => applyMovesDebounced());
  obs.observe(header, { childList: true, subtree: true });
}
