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
 * Works for both direct clicks and gallery-arrow changes, since both
 * ultimately change the checked radio.
 */
function jjInitSwatchAutoScroll() {
    // Only target the Color group: first swatch field in product options
    const colorField = document.querySelector(
        '.productView-options .form-field[data-product-attribute="swatch"]',
    );

    if (!colorField) return;

    // IMPORTANT: scroll only the inner swatch strip so the label stays put
    const container =
        colorField.querySelector('.form-field-control') || colorField;

    function scrollActiveIntoView() {
        // Swatch markup is "input + .form-option" inside the container
        let activeOption = container.querySelector(
            'input.form-radio:checked + .form-option',
        );

        // Fallback: search from the field if for some reason it's outside
        if (!activeOption) {
            activeOption = colorField.querySelector(
                'input.form-radio:checked + .form-option',
            );
        }
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
    // Helper: move the selected COLOR swatch left/right
    function moveColor(delta) {
        // Grab the first swatch group – this is your Color row
        const $swatchGroup = $('.productView-options [data-product-attribute="swatch"]').first();
        if (!$swatchGroup.length) return;

        const $options = $swatchGroup.find('input.form-radio');
        if (!$options.length) return;

        // Current index based on the checked radio
        let currentIndex = $options.index($options.filter(':checked'));
        if (currentIndex === -1) {
            currentIndex = 0;
        }

        let newIndex = currentIndex + delta;
        const count = $options.length;

        // Wrap around
        if (newIndex < 0) {
            newIndex = count - 1;
        } else if (newIndex >= count) {
            newIndex = 0;
        }

        const $target = $options.eq(newIndex);
        if (!$target.length) return;

        // Let BigCommerce handle all the variant logic
        $target.trigger('click').focus();
    }

    // Wire the buttons — delegate off document so we always catch clicks
    $(document).on('click', '.jj-gallery-arrow--prev', (event) => {
        event.preventDefault();
        moveColor(-1);
    });

    $(document).on('click', '.jj-gallery-arrow--next', (event) => {
        event.preventDefault();
        moveColor(1);
    });
});
