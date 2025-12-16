/**
 * JJ Product page DOM moves (JJ only)
 *
 * Goal:
 * Move these items to directly under Add to Cart:
 *  - Availability block (Availability Text)
 *  - Custom Fields block (any number of custom fields)
 *  - "Write a Review" link
 *
 * Why this version works:
 * BigCommerce/Roots can rebuild parts of productView-details after initial load
 * (options/variants init). So we run AFTER the page is loaded, then also
 * re-run (debounced) after product option changes. If BC rebuilds those nodes,
 * we move them again.
 */

export default function jjProductMoves() {
  const jjRoot =
    document.querySelector(".jj-product-page") ||
    document.getElementById("jj-product-page");

  if (!jjRoot) return;

  // Proven-live marker (keeps your current debugging signal intact)
  try {
    document.documentElement.setAttribute("data-jj-moves", "true");
  } catch (_) {}

  // Where to move things TO (right under Add to Cart)
  const addToCartWrapper =
    jjRoot.querySelector("#add-to-cart-wrapper") ||
    jjRoot.querySelector(".add-to-cart-wrapper") ||
    jjRoot.querySelector(".add-to-cart-buttons");

  if (!addToCartWrapper) return;

  // Create (or reuse) the target container, and ensure it sits right after ATC
  function getOrCreateTarget() {
    let target = jjRoot.querySelector(".jj-below-atc");
    if (!target) {
      target = document.createElement("div");
      target.className = "jj-below-atc";
    }

    // Ensure correct placement (immediately after Add to Cart wrapper)
    const desiredNext = addToCartWrapper.nextElementSibling;
    if (desiredNext !== target) {
      addToCartWrapper.insertAdjacentElement("afterend", target);
    }

    return target;
  }

  // --- Helpers to find the exact blocks reliably ---
  function findAvailabilityBlock() {
    // Prefer the whole info <dl> if it exists (most stable)
    const infoDl =
      jjRoot.querySelector(".productView-details .productView-info") ||
      jjRoot.querySelector(".productView-product .productView-info");

    if (infoDl) return infoDl;

    // Fallback: find the specific Availability dt, then move its containing dl
    const dts = jjRoot.querySelectorAll("dt.productView-info-name");
    for (let i = 0; i < dts.length; i++) {
      const txt = (dts[i].textContent || "").trim().toLowerCase();
      if (txt.startsWith("availability")) {
        const dl = dts[i].closest("dl");
        if (dl) return dl;

        // Last resort: move dt+dd pair (rare layout)
        const dd = dts[i].nextElementSibling;
        if (dd && dd.tagName && dd.tagName.toLowerCase() === "dd") {
          const wrapper = document.createElement("div");
          wrapper.className = "jj-availability-pair";
          dts[i].parentNode.insertBefore(wrapper, dts[i]);
          wrapper.appendChild(dts[i]);
          wrapper.appendChild(dd);
          return wrapper;
        }
      }
    }
    return null;
  }

  function findCustomFieldsBlock() {
    return (
      jjRoot.querySelector(".productView-details .productView-customFields") ||
      jjRoot.querySelector(".productView-product .productView-customFields")
    );
  }

  function findWriteReviewLink() {
    return (
      jjRoot.querySelector(".productView-product .productView-reviewLink") ||
      jjRoot.querySelector(".productView-details .productView-reviewLink") ||
      jjRoot.querySelector("a[href*='#write_review']") ||
      jjRoot.querySelector("a[href*='write_review']")
    );
  }

  // --- The actual move (idempotent) ---
  function moveNow() {
    const target = getOrCreateTarget();

    const availability = findAvailabilityBlock();
    const customFields = findCustomFieldsBlock();
    const reviewLink = findWriteReviewLink();

    // Append in the exact order you want under ATC:
    // Availability → Custom Fields → Write a Review
    if (availability) target.appendChild(availability);
    if (customFields) target.appendChild(customFields);
    if (reviewLink) target.appendChild(reviewLink);
  }

  // --- “Option A” timing: run after load + after product option updates ---
  // Debounced scheduler so we can call it from multiple triggers safely.
  let t = null;
  function scheduleMove() {
    if (t) window.clearTimeout(t);

    // Two-stage: small delay + next paint ensures we run after BC DOM updates
    t = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        moveNow();
      });
    }, 120);
  }

  // 1) Initial run after page settles
  //    - window load catches late inserts (images/async scripts)
  if (document.readyState === "complete") {
    scheduleMove();
  } else {
    window.addEventListener("load", scheduleMove, { once: true });
    document.addEventListener("DOMContentLoaded", scheduleMove, { once: true });
  }

  // 2) Re-run after any product option change (BC often rebuilds info/customFields)
  const form =
    jjRoot.querySelector("form.form") ||
    jjRoot.querySelector("form[data-cart-item-add]") ||
    document.querySelector("form.form");

  if (form) {
    form.addEventListener("change", scheduleMove, true);
    form.addEventListener("input", scheduleMove, true);
  }

  // 3) Extra safety for swatch clicks (some themes trigger changes indirectly)
  jjRoot.addEventListener("click", (e) => {
    const el = e.target;
    if (!el) return;

    // Swatch labels / options commonly involved
    if (
      el.closest &&
      (el.closest(".form-option") ||
        el.closest(".form-option-wrapper") ||
        el.closest("[data-product-attribute='swatch']"))
    ) {
      scheduleMove();
    }
  });

  // 4) One immediate run (helps when everything is already in DOM)
  scheduleMove();
}
