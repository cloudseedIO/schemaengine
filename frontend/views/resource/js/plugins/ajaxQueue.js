/**
 * stackoverflow.com/questions/1058158/what-are-queues-in-jquery/3314877#3314877
 * http://stackoverflow.com/questions/3034874/sequencing-ajax-requests/3035268#3035268
 * @param $
 */

(function($) {
var ajaxQueue = $({});
$.ajaxQueue = function( ajaxOpts ) {
	if (ajaxOpts=='clear'){
	    ajaxQueue.clearQueue();
	    return promise;
	}
    var jqXHR,
        dfd = $.Deferred(),
        promise = dfd.promise();
    ajaxQueue.queue( doRequest );
    promise.abort = function( statusText ) {
        if ( jqXHR ) {
            return jqXHR.abort( statusText );
        }
        var queue = ajaxQueue.queue(),
            index = $.inArray( doRequest, queue );
        if ( index > -1 ) {
            queue.splice( index, 1 );
        }
        dfd.rejectWith( ajaxOpts.context || ajaxOpts,
            [ promise, statusText, "" ] );
        return promise;
    };
    function doRequest( next ) {
        jqXHR = $.ajax( ajaxOpts )
            .done( dfd.resolve )
            .fail( dfd.reject )
            .then( next, next );
    }
    return promise;
};
})(jQuery);