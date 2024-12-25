(function( $ ){
    $(document).ready(function() {
        /**
         * Booking product Stays
         */
        const staysClass = $('.show_if_specification');

        // Show or hide bulk product panel On Change
        $( 'input#_specification' ).on( 'change', function() {
            if ( $(this).is(':checked') ) {
                staysClass.show();
            } else {
                staysClass.hide();
            }
        }).trigger('change');
    });
})(jQuery);