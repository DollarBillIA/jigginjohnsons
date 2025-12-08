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
            if (this.url.indexOf('#write_review') !== -1 && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        this.productDetails = new ProductDetails($('.productView'), this.context, window.BCData.product_attributes);
        this.productDetails.setProductVariant();

        videoGallery();

        this.bulkPricingHandler();

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
// JJ – image nav arrows controlling color swatches
$(document).ready(() => {
    const $imgContainer = $('.productView-img-container');

    if (!$imgContainer.length) return;

    // Add wrapper class so our SCSS positions arrows correctly
    $imgContainer.addClass('jj-image-nav-wrapper');

    // Only inject buttons once
    if ($imgContainer.find('.jj-image-nav').length === 0) {
        $imgContainer.append(`
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
        `);
    }

    // Helper: move the selected COLOR swatch left/right
    function moveColor(delta) {
        // Grab the first swatch group – this is your Color row
        const $swatchGroup = $('[data-product-attribute="swatch"]').first();
        if (!$swatchGroup.length) return;

        const $options = $swatchGroup.find('input.form-radio');
        if (!$options.length) return;

        let currentIndex = $options.index($options.filter(':checked'));

        // If nothing is checked for some reason, default to first
        if (currentIndex === -1) {
            currentIndex = 0;
        }

        let newIndex = currentIndex + delta;

        // Wrap around
        if (newIndex < 0) {
            newIndex = $options.length - 1;
        } else if (newIndex >= $options.length) {
            newIndex = 0;
        }

        const $target = $($options.get(newIndex));

        // Trigger click so BigCommerce's own JS runs:
        // - image swap
        // - price / variant update
        $target.trigger('click').focus();
    }

    // Wire the buttons
    $imgContainer.on('click', '.jj-image-nav--prev', (event) => {
        event.preventDefault();
        moveColor(-1);
    });

    $imgContainer.on('click', '.jj-image-nav--next', (event) => {
        event.preventDefault();
        moveColor(1);
    });
});
