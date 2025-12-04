(function () {
  function forEachNode(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function initJJProductPage() {
    var page = document.getElementById('jj-product-page');
    if (!page) {
      return;
    }

    /* ============================
       GALLERY BEHAVIOR
    ============================ */
    var mainImage = document.getElementById('jj-main-image');
    var thumbButtons = page.querySelectorAll('.gallery-thumb');
    var arrowButtons = page.querySelectorAll('.img-arrow');
    var totalImages = thumbButtons.length;
    var currentIndex = 0;

    function setActiveImage(index) {
      if (!mainImage || totalImages === 0) {
        return;
      }
      if (index < 0) {
        index = totalImages - 1;
      }
      if (index >= totalImages) {
        index = 0;
      }
      currentIndex = index;

      var activeThumb = page.querySelector(
        '.gallery-thumb[data-image-index="' + index + '"]'
      );
      if (activeThumb) {
        var src = activeThumb.getAttribute('data-src');
        var imgEl = activeThumb.querySelector('img');
        var alt = imgEl ? imgEl.getAttribute('alt') : mainImage.alt;

        if (src) {
          mainImage.src = src;
        }
        if (alt) {
          mainImage.alt = alt;
        }
      }

      forEachNode(thumbButtons, function (btn) {
        btn.classList.remove('is-active');
      });
      if (activeThumb) {
        activeThumb.classList.add('is-active');
      }
    }

    forEachNode(thumbButtons, function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-image-index'), 10);
        if (!isNaN(idx)) {
          setActiveImage(idx);
        }
      });
    });

    forEachNode(arrowButtons, function (btn) {
      btn.addEventListener('click', function () {
        var dir = btn.getAttribute('data-direction');
        if (dir === 'prev') {
          setActiveImage(currentIndex - 1);
        } else if (dir === 'next') {
          setActiveImage(currentIndex + 1);
        }
      });
    });

    /* ============================
       OPTION PILLS → HIDDEN INPUTS
    ============================ */
    var optionPills = page.querySelectorAll('.pill[data-option-id]');
    var stickyVariantEl = page.querySelector('.sticky-cart__variant');

    function updateStickyVariant() {
      if (!stickyVariantEl) return;

      var selectedLabels = [];
      var groups = page.querySelectorAll('.config-group');

      forEachNode(groups, function (group) {
        var active = group.querySelector('.pill.is-active');
        if (active) {
          var text = active.textContent || active.innerText;
          if (text) {
            selectedLabels.push(text.replace(/\s+/g, ' ').trim());
          }
        }
      });

      if (selectedLabels.length) {
        stickyVariantEl.textContent = selectedLabels.join(' • ');
      } else {
        stickyVariantEl.textContent = 'Select options';
      }
    }

    forEachNode(optionPills, function (pill) {
      pill.addEventListener('click', function () {
        var optionId = pill.getAttribute('data-option-id');
        var valueId = pill.getAttribute('data-value-id');
        if (!optionId || !valueId) return;

        var group = pill.closest('.config-group');
        if (group) {
          var siblings = group.querySelectorAll('.pill');
          forEachNode(siblings, function (sib) {
            sib.classList.remove('is-active');
          });
        }
        pill.classList.add('is-active');

        var selector =
          'input.jj-option-input[name="attribute[' +
          optionId +
          ']"][value="' +
          valueId +
          '"]';
        var input = page.querySelector(selector);
        if (input) {
          input.checked = true;
        }

        updateStickyVariant();
      });
    });

    updateStickyVariant();

    /* ============================
       QUANTITY CONTROLS
    ============================ */
    var qtyDisplay = document.getElementById('jj-qty-display');
    var qtyInput = document.getElementById('jj-qty-input');
    var qtyButtons = page.querySelectorAll('.qty-btn');

    function setQty(newQty) {
      var qty = parseInt(newQty, 10);
      if (isNaN(qty) || qty < 1) {
        qty = 1;
      }
      if (qtyDisplay) {
        qtyDisplay.textContent = qty;
      }
      if (qtyInput) {
        qtyInput.value = qty;
      }
    }

    forEachNode(qtyButtons, function (btn) {
      btn.addEventListener('click', function () {
        var delta = parseInt(btn.getAttribute('data-qty-change'), 10) || 0;
        var current = parseInt(qtyInput ? qtyInput.value : '1', 10) || 1;
        setQty(current + delta);
      });
    });

    /* ============================
       AJAX ADD TO CART
    ============================ */
    var form = document.getElementById('jj-product-form');
    var mainButton = document.getElementById('jj-add-to-cart-main');
    var stickyButton = document.getElementById('jj-add-to-cart-sticky');

    function setSubmitting(isSubmitting) {
      if (!mainButton || !stickyButton) return;
      if (isSubmitting) {
        mainButton.disabled = true;
        stickyButton.disabled = true;
        mainButton.textContent = 'Adding...';
        stickyButton.textContent = 'Adding...';
      } else {
        mainButton.disabled = false;
        stickyButton.disabled = false;
        mainButton.textContent = 'Add to Cart';
        stickyButton.textContent = 'Add to Cart';
      }
    }

    function showSuccess() {
      if (!mainButton || !stickyButton) return;
      mainButton.textContent = 'Added!';
      stickyButton.textContent = 'Added!';
      setTimeout(function () {
        mainButton.textContent = 'Add to Cart';
        stickyButton.textContent = 'Add to Cart';
      }, 2000);
    }

    function showError() {
      if (!mainButton || !stickyButton) return;
      mainButton.textContent = 'Error';
      stickyButton.textContent = 'Error';
      setTimeout(function () {
        mainButton.textContent = 'Add to Cart';
        stickyButton.textContent = 'Add to Cart';
      }, 3000);
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (!window.fetch || !window.FormData) {
          // Fallback: normal submit if fetch not supported
          form.submit();
          return;
        }

        setSubmitting(true);

        var formData = new FormData(form);

        fetch(form.action, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin'
        })
          .then(function (response) {
            // We don't need the HTML cart page; just assume success if 2xx/3xx.
            if (!response.ok && response.status !== 302) {
              throw new Error('Cart error');
            }
            showSuccess();
          })
          .catch(function () {
            showError();
          })
          .finally(function () {
            setSubmitting(false);
          });
      });
    }

    if (stickyButton && form) {
      stickyButton.addEventListener('click', function (event) {
        event.preventDefault();
        // trigger the same AJAX submit logic
        var submitEvent = new Event('submit', { cancelable: true });
        form.dispatchEvent(submitEvent);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJJProductPage);
  } else {
    initJJProductPage();
  }
})();
