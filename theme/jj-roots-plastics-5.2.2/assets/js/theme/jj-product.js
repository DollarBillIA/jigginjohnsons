import jjProductMoves from './jj-product-moves';

;(function () {
  var page = document.getElementById('jj-product-page');
  if (!page) return;

  // Ensure JJ “moves” logic is bundled + runs (it is JJ-only by selector)
  try {
    jjProductMoves();
  } catch (e) {
    // Fail silently so JJ page never breaks if something changes upstream
  }

  function forEachNode(list, cb) {
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      cb(list[i], i);
    }
  }

  function closest(el, selector) {
    while (el && el !== document) {
      if (el.matches && el.matches(selector)) return el.matches(selector) ? el : null;
      el = el.parentNode;
    }
    return null;
  }

  var form = page.querySelector('#jj-product-form');
  var qtyDisplay = page.querySelector('#jj-qty-display');
  var qtyInput = page.querySelector('#jj-qty-input');
  var stickyVariantEl = page.querySelector('.sticky-cart__variant');
  var stickyAddBtn = page.querySelector('#jj-add-to-cart-sticky');
  var mainAddBtn = page.querySelector('#jj-add-to-cart-main');

  var optionGroups = page.querySelectorAll('.config-group');
  var optionRadios = page.querySelectorAll('.jj-option-radio');

  /* ============================
     QTY CONTROLS
  ============================ */
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

  /* ============================
     STICKY VARIANT TEXT
  ============================ */
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
          if (text) {
            selectedLabels.push(text.replace(/\s+/g, ' ').trim());
          }
        }
      }
    });

    if (selectedLabels.length) {
      stickyVariantEl.textContent = selectedLabels.join(' • ');
    } else {
      stickyVariantEl.textContent = 'Select options';
    }
  }

  /* ============================
     PILL ↔ RADIO SYNC
  ============================ */
  forEachNode(optionRadios, function (radio) {
    radio.addEventListener('change', function () {
      var group = closest(radio, '.config-group');
      if (group) {
        var radiosInGroup = group.querySelectorAll('.jj-option-radio');
        forEachNode(radiosInGroup, function (r) {
          var label = page.querySelector('label[for="' + r.id + '"]');
          if (label) {
            if (r.checked) {
              label.classList.add('is-active');
            } else {
              label.classList.remove('is-active');
            }
          }
        });
      }

      updateStickyVariant();
    });
  });

  // Initial pill states and sticky summary
  (function initOptions() {
    forEachNode(optionGroups, function (group) {
      var radiosInGroup = group.querySelectorAll('.jj-option-radio');
      forEachNode(radiosInGroup, function (r) {
        var label = page.querySelector('label[for="' + r.id + '"]');
        if (label) {
          if (r.checked) {
            label.classList.add('is-active');
          } else {
            label.classList.remove('is-active');
          }
        }
      });
    });

    updateStickyVariant();
  })();

  /* ============================
     GALLERY ARROWS → COLOR OPTION
     (assumes first option group is color)
  ============================ */
  var arrows = page.querySelectorAll('.img-arrow');
  var colorGroup = optionGroups.length ? optionGroups[0] : null;
  var colorRadios = colorGroup ? colorGroup.querySelectorAll('.jj-option-radio') : [];

  function getCurrentColorIndex() {
    var idx = 0;
    forEachNode(colorRadios, function (radio, i) {
      if (radio.checked) {
        idx = i;
      }
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

          // Fire a change event so BigCommerce product.js updates price, availability, etc.
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
    });
  });

  /* ============================
     STICKY ADD-TO-CART
     (delegate to main button so BC JS handles form)
  ============================ */
  if (stickyAddBtn && mainAddBtn) {
    stickyAddBtn.addEventListener('click', function () {
      mainAddBtn.click();
    });
  }

  // No custom form submit handler here — we want BigCommerce's theme/product.js to own add-to-cart
})();
