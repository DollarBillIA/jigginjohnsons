/**
 * JJ Products Only — Sticky Add to Cart bar (mobile)
 * - Shows only when main Add to Cart is off-screen
 * - Matches JJ ATC styling via CSS
 * - Displays selected option summary (Color/Scent/etc.)
 */
export default function jjStickyATC() {
  const jjRoot = document.querySelector('.jj-product-page');
  if (!jjRoot) return;

  const mainATC =
    jjRoot.querySelector('#form-action-addToCart') ||
    jjRoot.querySelector('input#form-action-addToCart');

  if (!mainATC) return;

  const atcWrapper =
    jjRoot.querySelector('#add-to-cart-wrapper') ||
    jjRoot.querySelector('.add-to-cart-wrapper') ||
    mainATC.closest('.add-to-cart-buttons') ||
    mainATC.parentElement;

  if (!atcWrapper) return;

  // --- Build sticky bar
  const bar = document.createElement('div');
  bar.className = 'jj-sticky-atc';
  bar.setAttribute('aria-hidden', 'true');

  const left = document.createElement('div');
  left.className = 'jj-sticky-atc__left';

  const summary = document.createElement('div');
  summary.className = 'jj-sticky-atc__summary';
  summary.textContent = 'Select options';

  left.appendChild(summary);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'jj-sticky-atc__btn';
  btn.textContent = 'Add to Cart';

  bar.appendChild(left);
  bar.appendChild(btn);
  document.body.appendChild(bar);

  // --- Helpers
  function isMobile() {
    return window.matchMedia('(max-width: 600px)').matches;
  }

  function readSelectedOptions() {
    // Grab checked radios/selects inside product options area
    const optsRoot = jjRoot.querySelector('.productView-options') || jjRoot;

    // Radios (swatches + other radios)
    const checkedRadios = optsRoot.querySelectorAll('input[type="radio"]:checked');

    const parts = [];
    checkedRadios.forEach((r) => {
      const label =
        r.getAttribute('aria-label') ||
        r.getAttribute('data-option-label') ||
        r.value;

      if (label) parts.push(label.trim());
    });

    // Selects (dropdown options)
    const selects = optsRoot.querySelectorAll('select');
    selects.forEach((s) => {
      const opt = s.options && s.selectedIndex >= 0 ? s.options[s.selectedIndex] : null;
      const txt = opt ? (opt.textContent || '').trim() : '';
      if (txt && !/choose|select/i.test(txt)) parts.push(txt);
    });

    if (!parts.length) return 'Select options';

    // Keep it compact
    const clean = parts
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    // If it gets long, truncate
    const joined = clean.join(' • ');
    return joined.length > 60 ? joined.slice(0, 57) + '…' : joined;
  }

  function syncDisabledState() {
    const disabled = mainATC.disabled || mainATC.classList.contains('is-disabled');
    btn.disabled = !!disabled;
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  function updateSummary() {
    summary.textContent = readSelectedOptions();
  }

  function showBar() {
    if (!isMobile()) {
      bar.classList.remove('is-visible');
      bar.setAttribute('aria-hidden', 'true');
      return;
    }
    bar.classList.add('is-visible');
    bar.setAttribute('aria-hidden', 'false');
  }

  function hideBar() {
    bar.classList.remove('is-visible');
    bar.setAttribute('aria-hidden', 'true');
  }

  // --- Click: delegate to main Add to Cart so BigCommerce handles validation + add-to-cart
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    mainATC.click();
  });

  // --- Observe whether main ATC is visible
  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries && entries.length ? entries[0] : null;
      if (!entry) return;

      // If main ATC is visible, hide sticky. Otherwise show it.
      if (entry.isIntersecting) hideBar();
      else showBar();
    },
    { threshold: 0.15 }
  );

  io.observe(atcWrapper);

  // --- Keep summary + disabled state updated
  const optsRoot = jjRoot.querySelector('.productView-options') || jjRoot;

  optsRoot.addEventListener('change', () => {
    updateSummary();
    syncDisabledState();
  });

  // Some themes toggle disabled state without firing change on options
  const mo = new MutationObserver(() => {
    syncDisabledState();
  });
  mo.observe(mainATC, { attributes: true, attributeFilter: ['disabled', 'class'] });

  // On resize, re-evaluate
  window.addEventListener('resize', () => {
    // If we leave mobile, hide the bar
    if (!isMobile()) hideBar();
  });

  // Init
  updateSummary();
  syncDisabledState();
}

(() => {
  // Run immediately on pages where JJ wrapper exists
  try {
    jjStickyATC();
  } catch (e) {
    // Fail silently (don’t break page)
  }
})();
