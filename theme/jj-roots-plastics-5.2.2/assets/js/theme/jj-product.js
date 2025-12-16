;(function () {
  var page = document.getElementById('jj-product-page') || document.querySelector('.jj-product-page');
  if (!page) return;

  function forEachNode(list, cb) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) cb(list[i], i);
  }

  function closest(el, selector) {
    while (el && el !== document) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentNode;
    }
    return null;
  }

  /* ============================
     YOUR EXISTING JJ CODE (qty/options/arrows)
  ============================ */

  var form = page.querySelector('#jj-product-form');
  var qtyDisplay = page.querySelector('#jj-qty-display');
  var qtyInput = page.querySelector('#jj-qty-input');
  var stickyVariantEl = page.querySelector('.sticky-cart__variant');
  var stickyAddBtn = page.querySelector('#jj-add-to-cart-sticky');
  var mainAddBtn = page.querySelector('#jj-add-to-cart-main');

  var optionGroups = page.querySelectorAll('.config-group');
  var optionRadios = page.querySelectorAll('.jj-option-radio');

  var qtyButtons = page.querySelectorAll('.qty-btn[data-qty-change]');

  function setQty(newQty) {
    var q = parseInt(newQty, 10);
    if (isNaN(q) || q < 1) q = 1;
    if (q > 99) q = 99;
    if (qtyDisplay) qtyDisplay.textContent = String(q);
    if (qtyInput) qtyInput.value = String(q);
  }

  forEachNode(qtyButtons, function (btn) {
    btn.addEventListener('click', function () {
      var delta = parseInt(btn.getAttribute('data-qty-change'), 10) || 0;
      var current = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
      setQty(current + delta);
    });
  });

  function updateStickyVariant() {
    if (!stickyVariantEl) return;

    var selectedLabels = [];

    forEachNode(optionGroups, function (group) {
      var checked = group.querySelector('.jj-option-radio:checked');
      if (checked) {
        var labelNode =
          page.querySelector('label[for="' + checked.id + '"] .pill-label') ||
          page.querySelector('label[for="' + checked.id + '"]');

        if (labelNode) {
          var text = labelNode.textContent || labelNode.innerText;
          if (text) selectedLabels.push(text.replace(/\s+/g, ' ').trim());
        }
      }
    });

    stickyVariantEl.textContent = selectedLabels.length
      ? selectedLabels.join(' • ')
      : 'Select options';
  }

  forEachNode(optionRadios, function (radio) {
    radio.addEventListener('change', function () {
      var group = closest(radio, '.config-group');
      if (group) {
        var radiosInGroup = group.querySelectorAll('.jj-option-radio');
        forEachNode(radiosInGroup, function (r) {
          var label = page.querySelector('label[for="' + r.id + '"]');
          if (!label) return;
          if (r.checked) label.classList.add('is-active');
          else label.classList.remove('is-active');
        });
      }
      updateStickyVariant();
      scheduleMoves(); // keep below-ATC block correct after option changes
    });
  });

  (function initOptions() {
    forEachNode(optionGroups, function (group) {
      var radiosInGroup = group.querySelectorAll('.jj-option-radio');
      forEachNode(radiosInGroup, function (r) {
        var label = page.querySelector('label[for="' + r.id + '"]');
        if (!label) return;
        if (r.checked) label.classList.add('is-active');
        else label.classList.remove('is-active');
      });
    });
    updateStickyVariant();
  })();

  var arrows = page.querySelectorAll('.img-arrow');
  var colorGroup = optionGroups.length ? optionGroups[0] : null;
  var colorRadios = colorGroup ? colorGroup.querySelectorAll('.jj-option-radio') : [];

  function getCurrentColorIndex() {
    var idx = 0;
    forEachNode(colorRadios, function (radio, i) {
      if (radio.checked) idx = i;
    });
    return idx;
  }

  function setColorIndex(newIndex) {
    if (!colorRadios.length) return;

    var len = colorRadios.length;
    var idx = newIndex;

    if (idx < 0) idx = len - 1;
    if (idx >= len) idx = 0;

    forEachNode(colorRadios, function (radio, i) {
      var label = page.querySelector('label[for="' + radio.id + '"]');

      if (i === idx) {
        if (!radio.checked) {
          radio.checked = true;
          var evt = document.createEvent('HTMLEvents');
          evt.initEvent('change', true, false);
          radio.dispatchEvent(evt);
        }
        if (label) label.classList.add('is-active');
      } else {
        if (label) label.classList.remove('is-active');
      }
    });
  }

  forEachNode(arrows, function (arrow) {
    arrow.addEventListener('click', function () {
      if (!colorRadios.length) return;
      var current = getCurrentColorIndex();
      var next = arrow.classList.contains('img-arrow--right') ? current + 1 : current - 1;
      setColorIndex(next);
      scheduleMoves();
    });
  });

  if (stickyAddBtn && mainAddBtn) {
    stickyAddBtn.addEventListener('click', function () {
      mainAddBtn.click();
    });
  }

  /* ============================
     JJ MOVES — Availability + Custom Fields + Review
     (under Add to Cart, JJ only)
  ============================ */

  function findAtcAnchor() {
    // Primary Roots containers
    var el =
      page.querySelector('#add-to-cart-wrapper') ||
      page.querySelector('.add-to-cart-wrapper') ||
      page.querySelector('.add-to-cart-buttons');

    if (el) return el;

    // Fallback: find the actual submit button and work upward
    var btn =
      page.querySelector('#form-action-addToCart') ||
      page.querySelector('input#form-action-addToCart') ||
      page.querySelector('input.button--primary[type="submit"]');

    if (!btn) return null;

    var formAction = closest(btn, '.form-action');
    if (formAction && formAction.parentElement) return formAction.parentElement;

    return formAction || null;
  }

  function getOrCreateTarget(afterEl) {
    var target = page.querySelector('.jj-below-atc');
    if (!target) {
      target = document.createElement('div');
      target.className = 'jj-below-atc';
    }

    if (afterEl && afterEl.nextElementSibling !== target) {
      afterEl.insertAdjacentElement('afterend', target);
    }

    return target;
  }

  function findAvailabilityBlock() {
    // Look specifically for the "Availability" dt you showed in DevTools
    var dts = page.querySelectorAll('dt.productView-info-name');
    var availabilityDt = null;

    forEachNode(dts, function (dt) {
      var t = (dt.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (t.indexOf('availability') === 0) {
        availabilityDt = dt;
      }
    });

    if (!availabilityDt) return null;

    // In Roots this is typically inside dl.productView-info
    var dl = closest(availabilityDt, 'dl.productView-info');
    return dl || null;
  }

  function moveBlocksNow() {
    // Marker so you can confirm execution in Elements (<html data-jj-moves="true">)
    document.documentElement.setAttribute('data-jj-moves', 'true');

    var atc = findAtcAnchor();
    if (!atc) return;

    var target = getOrCreateTarget(atc);

    // 1) Availability (dl.productView-info)
    var availabilityDl = findAvailabilityBlock();

    // 2) Custom Fields container (can be any number of fields, we move the whole block)
    var customFields =
      page.querySelector('.productView-customFields') ||
      page.querySelector('.productView-details .productView-customFields') ||
      page.querySelector('.productView-product .productView-customFields');

    // 3) Write a Review link
    var reviewLink =
      page.querySelector('.productView-reviewLink') ||
      page.querySelector('a[href*="#write_review"]') ||
      page.querySelector('a[href*="write_review"]');

    // Move in the exact order you want under ATC:
    if (availabilityDl) target.appendChild(availabilityDl);
    if (customFields) target.appendChild(customFields);
    if (reviewLink) target.appendChild(reviewLink);
  }

  var _movesTimer = null;
  function scheduleMoves() {
    if (_movesTimer) window.clearTimeout(_movesTimer);
    _movesTimer = window.setTimeout(function () {
      window.requestAnimationFrame(function () {
        moveBlocksNow();
      });
    }, 120);
  }

  scheduleMoves();

  // Keep it stable if BC re-renders pieces of the header/details area
  var obsTarget =
    page.querySelector('.productView-details') ||
    page.querySelector('.productView') ||
    page;

  if (window.MutationObserver && obsTarget) {
    var mo = new MutationObserver(function () {
      scheduleMoves();
    });
    mo.observe(obsTarget, { childList: true, subtree: true });
  }
})();
