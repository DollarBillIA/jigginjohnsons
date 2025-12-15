/**
 * JJ Product page: move Availability + ALL Custom Fields + Write a Review
 * directly under the Add to Cart area (JJ only).
 *
 * - Availability lives in: .productView-info (dt/dd pairs)
 * - Custom fields live in: .productView-customFields (can contain many fields)
 * - Review link is a separate element
 */
export default function jjProductMoves() {
  const jjRoot = document.querySelector(".jj-product-page");
  if (!jjRoot) return;

  // Add-to-cart wrapper (Roots commonly uses this id; keep a fallback)
  const addToCartWrapper =
    jjRoot.querySelector("#add-to-cart-wrapper") ||
    jjRoot.querySelector(".add-to-cart-wrapper");

  if (!addToCartWrapper) return;

  // Create/reuse the target container immediately after Add to Cart
  let target = jjRoot.querySelector(".jj-below-atc");
  if (!target) {
    target = document.createElement("div");
    target.className = "jj-below-atc";
    addToCartWrapper.insertAdjacentElement("afterend", target);
  }

  // 1) Availability block (dt/dd list)
  const availabilityBlock =
    jjRoot.querySelector(".productView-product .productView-info") ||
    jjRoot.querySelector(".productView-info");

  // 2) ALL custom fields (any number of rows)
  const customFieldsBlock =
    jjRoot.querySelector(".productView-product .productView-customFields") ||
    jjRoot.querySelector(".productView-customFields");

  // 3) Write-a-review link
  const writeReviewLink =
    jjRoot.querySelector(".productView-product .productView-reviewLink") ||
    jjRoot.querySelector("a.productView-reviewLink") ||
    jjRoot.querySelector("a[href*='#write_review']") ||
    jjRoot.querySelector("a[href*='write_review']") ||
    jjRoot.querySelector("a[href*='review']");

  // Move in stable order:
  // Availability → Custom Fields → Write a Review
  if (availabilityBlock) target.appendChild(availabilityBlock);
  if (customFieldsBlock) target.appendChild(customFieldsBlock);
  if (writeReviewLink) target.appendChild(writeReviewLink);
}
