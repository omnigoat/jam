//=====================================================================
//
//=====================================================================
;(function(jam, $, undefined) {
	if (jam.ui === undefined) {
		jam.ui = {};
	}
	
	
	//=====================================================================
	// function that creates a scrollbar
	//=====================================================================
	jam.ui.scrollbar = function self($elem, options) {
		return new jam.ui.scrollbar._init($elem, options);
	};
	
	
	//=====================================================================
	//
	// extending the scrollbar object
	//
	//=====================================================================
	$.extend(jam.ui.scrollbar, {
		//=====================================================================
		// default options for scrollbar
		//=====================================================================
		defaults:
		{
			min: 0,
			max: 100,
			value: 0,
			step: 1,
			orientation: "horizontal",
			enabled: true,
			paging_multiplier: 5,

			// the actual step used
			used_step: undefined,
			min_pixel_step: 6,

			// it's possible we'd have a range so large we'd move < 1 pixel
			// for every step. force_pixelstep would mean we'd multiply the
			// used step until the nub moved > 1 pixel for every step
			force_pixelstep: true,

			// default change function does nothing
			change: function() {},
		},
		
		//=====================================================================
		// the skeletal scrollbar
		//=====================================================================
		_settings: undefined, // please define later
		
		value: function(v, relative, require_step)
		{
			var hz = this._settings.horizontal,
			    axis = hz ? 'left' : 'top',
			    x = this.$nub.position()[axis],
				  step = this._settings.used_step,
				  delta = this._settings.pixel_delta
				  v = require_step ? v * step : v
				  ;
			
			if (v === undefined) {
				return Math.round(x / delta) * step;
			}
			else {
				var bounded_value = jam.bounded(0, relative ? this._settings.current_value + v : v, this._settings.max);
				this._round_nub(bounded_value);
				this._send_change(bounded_value, true);
			}
		},
		
		_round_nub: function(bounded_value) {
			bounded_value = bounded_value === undefined ? this._settings.current_value : bounded_value;
			this.$nub.css(this._settings.horizontal ? 'left' : 'top', (bounded_value / this._settings.used_step) * this._settings.pixel_delta)
			this._recalculate_innerbars();
		},
		
		_send_change: function(bounded_value)
		{
			var old_value = this._settings.old_value = this._settings.current_value;
			this._settings.current_value = bounded_value;
			this._settings.change.apply(this.$whole, [bounded_value, old_value, this]);
		},
		
		// returns true if the nub has moved enough to change the value. 
		// also returns the value
		_changed: function(position)
		{
			// only calculate the position of the nub if we've not been given it
			position = position || this.$nub.position()[this._settings.horizontal ? 'left' : 'top']
			var v = Math.round(position / this._settings.pixel_delta) * this._settings.used_step;
			var changed = v != this._settings.current_value;
			
			return {'changed': changed, 'value': v};
		},
		
		setting: function(s, v) {
			if (v === undefined) {
				return this._settings[s];
			} else {
				this._settings[s] = v;
				this._calculate_deltas();
			}
		},
		
		// "poised" bits change colour on mouse-hover
		_poised: function(sb) {
			this._poisable().addClass("jam-ui-poised", 600);
		},
		_unpoised: function(sb) {
			this._poisable().removeClass("jam-ui-poised", 1200);
		},
		_poisable: function() {
			return this.$less_button.add(this.$more_button).add(this.$nub);
		},
		
		// the size of the bars on either side of the nub must change whenever
		// the nub moves
		_recalculate_innerbars: function() {
			if (this._settings.horizontal) {
				this.$less_bar.css({
						width: this.$nub.position().left,
					});
				
				this.$more_bar.css({
						width: this.$bar.innerWidth() - this.$nub.position().left - this.$nub.outerWidth(),
					});
			}
			else {
				this.$less_bar.css({
						height: this.$nub.position().top,
					});
				
				this.$more_bar.css({
						height: this.$bar.innerHeight() - this.$nub.position().top - this.$nub.outerHeight(),
					});
			}	
		},
		
		
		// the nub of the scrollbar has a few special properties. it changes from
		// poised to active whenever it's hovered directly, and if we mousedown and
		// then leave the bounds of our scrollbar, we do *not* become unpoised
		_nub_mouseenter: function() {
			$(this)
				.addClass("jam-ui-active")
				.one("mouseleave.scrollbar", sb._nub_mouseleave)
				;
		},

		_nub_mouseleave: function() {
			$(this).removeClass("jam-ui-active");
		},
		
		_nub_mousedown: function(sb, event)
		{
			var nub = this, $nub = sb.$nub, $whole = sb.$whole;
			$nub.unbind("mouseleave.scrollbar");
			$nub.unbind("mouseenter.scrollbar");
			$whole.unbind("mouseleave");
			
			$(document).one("mouseup.jam-ui-scrollbar", function(event) {
				if (event.target.parentNode === nub) {
					event.stopPropagation();
					$nub.bind("mouseleave.scrollbar", sb._nub_mouseleave);
					$whole.bind("mouseleave", sb._unpoised.partial(sb));
					$(document).unbind("mouseup.jam-ui-scrollbar");
				}
				else {
					sb._nub_mouseleave(); //$nub.removeClass("jam-ui-active");
					$nub.bind("mouseenter.scrollbar", sb._nub_mouseenter);
					sb._unpoised();
				}
			});
		},
		
		_range: function() {
			if (this._settings.horizontal) {
				return this.$bar.innerWidth() - this.$nub.outerWidth();
			} else {
				return this.$bar.innerHeight() - this.$nub.outerHeight();
			}
		},
		
		_nub_set: function(value) {
			this.$nub.css('left', jam.bounded(0, value, this._range()));
		},
		
		_calculate_deltas: function()
		{
			var pixels = this._range(),
			    range = this._settings.max,
			    step = this._settings.step
			    ;
			
			this._settings.used_step = step;
			this._settings.pixel_delta = pixels / (range / step);
			if (this._settings.pixel_delta > 0 && this._settings.force_pixelstep) {
				while (this._settings.pixel_delta < this._settings.min_pixel_step) {
					this._settings.used_step *= 2;
					this._settings.pixel_delta = pixels / (range / this._settings.used_step);
				}
			}
		},
		
		
		
		//=====================================================================
		// initialising the object
		//=====================================================================
		_init: function($elem, options)
		{
			// this instance has all the scrollbar functions too!
			$.extend(this, jam.ui.scrollbar);
			// this._settings now has the combined options
			this._settings = $.extend({}, this.defaults, options);
			this._settings.horizontal = this._settings.orientation === "horizontal";
			delete this._settings.orientation;
			this._settings.old_value = 0;
			this._settings.current_value = 0;
			
			// set up the structure of our scrollbar
			this.$whole = $elem;
			this.$less_button = $('<a href="#" class="jam-ui-button jam-ui-scrollbutton-less"><</a>');
			this.$bar = $('<div class="jam-ui-scrollbar-bar"></div>');
			this.$wrapper = $('<div></div>');
			this.$less_bar = $('<div id="less" class="jam-ui-scrollbar-innerbar"></div>');
			this.$nub = $('<a href="#" class="jam-ui-scrollbar-nub"></a>');
			this.$more_bar = $('<div id="more" class="jam-ui-scrollbar-innerbar"></div>');
			this.$more_button = $('<a href="#" class="jam-ui-scrollbutton-more jam-ui-button">></a>');
			
			// quickhand for horizontal scrollbars
			var hz = this._settings.horizontal;
			// needed for the scopes!
			var self = this;

			
			this.$whole
				.addClass("jam-ui-scrollbar")
				.addClass(hz ? "" : "jam-ui-vertical")
				.bind('mouseenter', function () {self._poised();})
				.bind('mouseleave', function () {self._unpoised();})
				;
			
				
			this.$less_button
				.appendTo(this.$whole)
				.css({
					'float': hz ? 'left' : undefined,
					display: "block",
					width: hz ? this.$whole.innerHeight() - 2 : this.$whole.innerWidth() - 2,
					height: hz ? this.$whole.innerHeight() - 2 : this.$whole.innerWidth() - 2,
					'text-decoration': 'none',
				})
				.bind("click", function() {
					self.value(-self._settings.used_step, true);
					event.preventDefault();
				})
				;
				
			
			this.$bar
				.appendTo(this.$whole)
				.css({
					'float': hz ? 'left' : undefined,
					dispaly: "block",
				})
				;
			
			jam.dynamically_size({
				element: this.$bar,
				in_response_to: [this.$whole, this.$less_button],
				using: {
					width: function($whole) {return hz ? $whole.innerWidth() - self.$less_button.outerWidth() * 2 : $whole.innerWidth();},
					height: function($whole) {return hz ? $whole.innerHeight() : $whole.innerHeight() - self.$less_button.outerHeight() * 2;},
				}
			});
			

				
			this.$wrapper
				.appendTo(this.$bar)
				.css({
					position: 'relative',
					height: '100%',
					width: '100%',
				})
				;
				
				
			this.$less_bar
				.appendTo(this.$wrapper)
				.css({
					position: 'absolute',
					height: hz ? this.$whole.innerHeight() : 1,
					width: hz ? 1 : this.$whole.innerWidth(),
				})
				.click(function(event) {
					self.value(-self._settings.used_step * self._settings.paging_multiplier, true);
					event.preventDefault();
				})
				;
			
			this.$nub
				.appendTo(this.$wrapper)
				.append($('<span>' + (hz ? '||' : '=') + '</span>')
					.css({
						display: "table-cell",
						'vertical-align': hz ? "auto" : "middle",
						"text-align": "center",
						width: hz ? 30 : this.$bar.innerWidth() - 2,
						height: hz ? this.$bar.innerHeight() - 2 : 30, //calculate_nub_size(),
					})
				)
				.css({
					width: hz ? 30 : this.$bar.innerWidth() - 2,
					height: hz ? this.$bar.innerHeight() - 2 : 30, //calculate_nub_size(),
					"text-align": "center",
					"vertical-align": "middle",
					"text-decoration": "none",
					'font-size': '0.6em',
					position: 'absolute',
					"z-index": 2,
				})
				.draggable({
					axis: hz ? "x" : "y",
					containment: this.$bar,
					
					stop: function(event) {
						var cv = self._changed();
						self._round_nub(cv.value);
						if (cv.changed) {
							self._send_change(cv.value);
						}
					},
					
					drag: function(event) {
						var cv = self._changed();
						if (cv.changed) {
							self._send_change(cv.value, false);
						}
					}
					
				})
				.bind("mouseenter", this._nub_mouseenter) //jam.ui.detail.scrollbar_nub_mouseenter)
				.bind("mousedown", function() {this._nub_mousedown})
				.mousedown(function(event) {
					event.preventDefault();
				})
				;
			
				
			this.$more_bar
				.appendTo(this.$wrapper)
				.css({
					position: 'absolute',
					right: hz ? 0 : undefined,
					bottom: hz ? undefined : 0,
					height: hz ? this.$bar.innerHeight() : 1,
					width: hz ? 1 : this.$bar.innerWidth(),
				})
				.click(function(event) {
					//console.log("blha");
					self.value(self._settings.used_step * self._settings.paging_multiplier, true);
					event.preventDefault();
				})
				;
				
			
			
			this.$more_button
				.appendTo(this.$whole)
				.css({
					'float': hz ? 'left' : 'none',
					display: "block",
					width: hz ? this.$whole.innerHeight() - 2 : this.$whole.innerWidth() - 2,
					height: hz ? this.$whole.innerHeight() - 2 : this.$whole.innerWidth() - 2,
					'text-decoration': 'none',
				})
				.click(function() {
					self.value(self._settings.used_step, true);
					event.preventDefault();
				})
				;
				
				
			var range_width = this.$wrapper.innerWidth() - this.$nub.outerWidth();
			
			this._recalculate_innerbars();
			this._calculate_deltas();
			
			//$elem[0].scrollbar = this;
			$elem.data('jam.ui.scrollbar', this);
			return this;
		},
	});
	
	
	jam.bounded = function(lbound, v, ubound) {
		return v < lbound ? lbound : v > ubound ? ubound : v;
	};
		
	
	
	
})(jam, jQuery);






