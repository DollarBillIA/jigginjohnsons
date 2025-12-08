/*
 Import all product specific js
*/
import PageManager from './page-manager';
import Review from './product/reviews';
import collapsibleFactory from './common/collapsible';
import ProductDetails from './common/product-details';
import videoGallery from './product/video-gallery';
import rootsLoaded from './roots/product';
import { classifyForm } from './common/utils/form-utils';
import modalFactory from './global/modal';

/**
 * JJ – Keep the selected COLOR swatch visible in its horizontal strip.
 * Works for both direct clicks and arrow changes, since both
 * ultimately change the checked radio.
 */
function jjInitSwatchAutoScroll() {
    // Only target the Color group: first swatch field in product options
    const colorField = document.querySelector(
        '.productView-options .form-field[data-product-attribute="swatch"]',
    );

    if (!colorField) return;

    const container = colorField; // we gave this overflow-x in SCSS

    function scrollActiveIntoView() {
        const activeOption = colorField.querySelector(
            'input.form-radio:checked + .form-option',
        );
        if (!activeOption) return;

        const containerRect = container.getBoundingClientRect();
        const targetRect = activeOption.getBoundingClientRect();

        const overflowLeft = targetRect.left - containerRect.left;
        const overflowRight = targetRect.right - containerRect.right;

        // If it sticks out left, nudge left; if it sticks out right, nudge right.
        if (overflowLeft < 0) {
            container.scrollLeft += overflowLeft;
        } else if (overflowRight > 0) {
            container.scrollLeft += overflowRight;
        }
    }

    // Initial pass (handles default color when page first loads)
    // Slight timeout so BC's own JS has finished applying classes.
    setTimeout(scrollActiveIntoView, 0);

    // Any time the color swatch selection changes, keep it visible.
    colorField.addEventListener('change', () => {
        // Again, let the core JS finish first.
        setTimeout(scrollActiveIntoView, 0);
    });
}

export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
        this.$bulkPricingLink = $('[data-reveal-id="modal-bulk-pricing"]');
        this.reviewModal = modalFactory('#modal-review-form')[0];
    }

    onReady() {
        // Listen for foundation modal close events to sanitize URL after review.
        $(document).on('close.fndtn.reveal', () => {
            if (
                this.url.indexOf('#write_review') !== -1 &&
                typeof window.history.replaceState === 'function'
            ) {
                window.history.replaceState(
                    null,
                    document.title,
                    window.location.pathname,
                );
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        this.productDetails = new ProductDetails(
            $('.productView'),
            this.context,
            window.BCData.product_attributes,
        );
        this.productDetails.setProductVariant();

        videoGallery();

        this.bulkPricingHandler();

        // JJ: keep the active COLOR swatch in view when it changes
        jjInitSwatchAutoScroll();

        // JJ: image arrows that cycle the COLOR swatches
        this.initJjImageNavArrows();

        const $reviewForm = classifyForm('.writeReview-form');

        if ($reviewForm.length === 0) return;

        const review = new Review({ $reviewForm });

        $('body').on('click', '[data-reveal-id="modal-review-form"]', () => {
            validator = review.registerValidation(this.context);
            this.ariaDescribeReviewInputs($reviewForm);
        });

        $reviewForm.on('submit', () => {
            if (validator) {
                validator.performCheck();
                return validator.areAll('valid');
            }

            return false;
        });

        rootsLoaded();

        this.productReviewHandler();
    }

    /**
     * Inject left/right arrows over the main image and wire them so they
     * move the *Color* swatch selection forward/backward.
     */
    initJjImageNavArrows() {
        const imgContainer = document.querySelector('.productView-img-container');
        if (!imgContainer) return;

        // Only inject once
        if (!imgContainer.classList.contains('jj-image-nav-wrapper')) {
            imgContainer.classList.add('jj-image-nav-wrapper');

            if (!imgContainer.querySelector('.jj-image-nav')) {
                imgContainer.insertAdjacentHTML(
                    'beforeend',
                    `
                        <button
                            type="button"
                            class="jj-image-nav jj-image-nav--prev"
                            aria-label="Previous color"
                        >
                            &#8249;
                        </button>
                        <button
                            type="button"
                            class="jj-image-nav jj-image-nav--next"
                            aria-label="Next color"
                        >
                            &#8250;
                        </button>
                    `,
                );
            }
        }

        // Locate the COLOR swatch field (first swatch group)
        const colorField = document.querySelector(
            '.productView-options .form-field[data-product-attribute="swatch"]',
        );
        if (!colorField) return;

        const getOptions = () =>
            Array.from(colorField.querySelectorAll('input.form-radio'));

        const getCurrentIndex = (options) => {
            const checkedIndex = options.findIndex((opt) => opt.checked);
            return checkedIndex === -1 ? 0 : checkedIndex;
        };

        const selectIndex = (delta) => {
            const options = getOptions();
            if (!options.length) return;

            const current = getCurrentIndex(options);
            const count = options.length;

            // Wrap around safely
            const nextIndex = ((current + delta) % count + count) % count;
            const target = options[nextIndex];
            if (!target) return;

            // Clicking the radio lets BigCommerce do:
            // - image swap
            // - price / variant update
            target.click();
        };

        imgContainer.addEventListener('click', (event) => {
            const prev = event.target.closest('.jj-image-nav--prev');
            const next = event.target.closest('.jj-image-nav--next');

            if (prev) {
                event.preventDefault();
                selectIndex(-1);
            } else if (next) {
                event.preventDefault();
                selectIndex(1);
            }
        });
    }

    ariaDescribeReviewInputs($form) {
        $form.find('[data-input]').each((_, input) => {
            const $input = $(input);
            const msgSpanId = `${$input.attr('name')}-msg`;

            $input.siblings('span').attr('id', msgSpanId);
            $input.attr('aria-describedby', msgSpanId);
        });
    }

    productReviewHandler() {
        if (this.url.indexOf('#write_review') !== -1) {
            this.$reviewLink.trigger('click');
        }
    }

    bulkPricingHandler() {
        if (this.url.indexOf('#bulk_pricing') !== -1) {
            this.$bulkPricingLink.trigger('click');
        }
    }
}
