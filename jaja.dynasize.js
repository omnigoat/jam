

//=====================================================================
// requires jaja.scrollbar
//=====================================================================
;(function(jaja, $, undefined) {
	
	// private function that is used by 
	var on_resize = function() {
		$.each($(this).data('jaja.dynamically_size'), function() {
			this();
		});
	};

	$.extend(jaja, {
		dynamically_size: function(options)
		{
			// default options, and option checking
			options = $.extend({}, jaja.dynamically_size.defaults, options);
			if (options.element === undefined || options.using === undefined) return false;
			

			var $element = options.element,
			// $triggers is an array of jquery objects, one for each trigger. by design.
			    $triggers = jaja.map(options.in_response_to, function(x) {return $(x);});
			    
			// save closure for possible instant execution
			var $element_on_resize = function() {
				$.each(options.using, function(i, command) {
					$element.css(i, command.apply($element, $triggers));
				});
			};

			// each trigger gets the same binding
			$.each($triggers, function(i, $trigger_elem)
			{
				// make sure the trigger element has a properly initialised list
				if ($trigger_elem.data('jaja.dynamically_size') === undefined) {
					$trigger_elem.data('jaja.dynamically_size', []);
				}

				// add this element to the trigger element's list of bound elements
				$trigger_elem.data('jaja.dynamically_size').push($element_on_resize);
				
				// only bind if this is the first element to be bound to the trigger_element
				if ($trigger_elem.data('jaja.dynamically_size').length === 1) {
					$trigger_elem.bind("resize.dynamically_size", on_resize);
				}
			});
			
			// possibly execute immediately
			if (options.apply_now) {
				$element_on_resize();
			}
		},
	});

	jaja.dynamically_size.defaults = {
		in_response_to: $(window),
		apply_now: true,
	};

})(jaja, jQuery);








