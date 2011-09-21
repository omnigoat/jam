


var jam = (function($, undefined) {
	
	//=====================================================================
	// add funcitonality to jQuery
	//=====================================================================
	$.fn.swap = function(b) {
		b = jQuery(b)[0];
		var a = this[0];

		var t = a.parentNode.insertBefore(document.createTextNode(''), a);
		b.parentNode.insertBefore(a, b);
		t.parentNode.insertBefore(b, t);
		t.parentNode.removeChild(t);

		return this;
	};

	var jam = {};


	// get scrollbar width
	$(function() {
		var scr = null;
		var inn = null;
		var wNoScroll = 0;
		var wScroll = 0;

		// Outer scrolling div
		scr = document.createElement('div');
		scr.style.position = 'absolute';
		scr.style.top = '-1000px';
		scr.style.left = '-1000px';
		scr.style.width = '100px';
		scr.style.height = '50px';
		// Start with no scrollbar
		scr.style.overflow = 'hidden';

		// Inner content div
		inn = document.createElement('div');
		inn.style.width = '100%';
		inn.style.height = '200px';

		// Put the inner div in the scrolling div
		scr.appendChild(inn);
		// Append the scrolling div to the doc
		document.body.appendChild(scr);

		// Width of the inner div sans scrollbar
		wNoScroll = inn.offsetWidth;
		// Add the scrollbar
		scr.style.overflow = 'auto';
		// Width of the inner div width scrollbar
		wScroll = inn.offsetWidth;

		// Remove the scrolling div from the doc
		document.body.removeChild(document.body.lastChild);

		// Pixel width of the scroller
		jam.page = {scrollbar_width: wNoScroll - wScroll};
	});





	//=====================================================================
	// DEFINE-CLASS
	//=====================================================================
	$.extend(jam, {
		define_class: function()
		{
			var jam_Object = function()
			{
				if (this.constructor == jam_Object) {
					return this;
				}

				var self = new jam_Object;
				jam_Object.__init__.apply(self, arguments);		
				return self;
			};

			jam_Object.__supers__ = [];

			jam_Object.__init__ = function() {
				for (var i = 0, ie = jam_Object.__supers__.length; i != ie; ++i) {
					jam_Object.__supers__[i].apply(this, arguments);
				}

				if (this.init) {
					this.init.apply(this, arguments);
				}
			};

			function _inheritor() {
				var args = Array.prototype.slice.call(arguments);
				
				// for each class to mix in
				for (var i = 0, ie = args.length; i != ie; ++i)
				{
					var x = args[i];

					// for each property in 
					for (var p in x.prototype) {
						if (p !== "init" && p.match(/^__(.+)__$/) === null && x.prototype.hasOwnProperty(p)) {
							jam_Object.prototype[p] = x.prototype[p];
						}
					}

					if (x.__supers__) {
						jam_Object.__supers__ = jam_Object.__supers__.concat(x.__supers__);
					}

					if (x.prototype.init) {
						jam_Object.__supers__.push(x.prototype.init);
					}
				}
			}

			function _as(properties) {
				for (var x in properties) {
					jam_Object.prototype[x] = properties[x];
				}
				return jam_Object;
			}

			return {
				inheriting: function() {
					_inheritor.apply(jam_Object, arguments);
					return {as: _as};
				},

				as: _as
			};
		}
	});






	//=====================================================================
	// CORE UTILITIES
	//=====================================================================
	$.extend(jam, {
		//=====================================================================
		// turns a normal predicate (lhs < rhs), into a javascript one [-1, 0, 1]
		//=====================================================================
		js_pred: function(pred) {
			return function(lhs, rhs) {
				return pred(lhs, rhs) ? -1 : pred(rhs, lhs) ? 1 : 0;
			};
		},

		//=====================================================================
		// a default predicate for various things
		//=====================================================================
		default_predicate: function(lhs, rhs) {
			return (lhs < rhs) ? -1 : (rhs < lhs) ? 1 : 0;
		},

		//=====================================================================
		// call a function asynchronously
		//=====================================================================
		async: function(fn) {
			setTimeout(fn, 0);
		},
	});






	//=====================================================================
	// ARRAY UTILITIES
	//=====================================================================
	$.extend(jam, {
		_reindex: function(range, i) {
			i = i === undefined ? range.length : i;
			return i >= 0 ? i : i + range.length + 1;
		},

		_default_range_options: function(range) {
			return {from: 0, until: range.length, step: 1};
		},

		_optionise: function(range, options, ignore_reverse)
		{
			options = $.extend(jam._default_range_options(range), options);
			options.from = jam._reindex(range, options.from);
			options.until = jam._reindex(range, options.until);

			if (!ignore_reverse && options.reverse) {
				options.step = -options.step;
				var t = options.from;
				options.from = options.until + options.step;
				options.until = t + options.step;
			}
		
			return options;
		},




		//---------------------------------------------------------------------
		// EACH
		//---------------------------------------------------------------------
		each: function(range, options, fn, callbacks)
		{
			if (options instanceof Function) {
				callbacks = fn;
				fn = options;
				options = jam._default_range_options(range);
			}
			else {
				options = jam._optionise(range, options);
			}

			callbacks = callbacks || {};

			var i = options.from, ie = options.until, result = true;
			while (i !== ie && result) {
				if (i !== options.from && callbacks.between) {
					callbacks.between.call(options.as, range[i - 1], range[i], i - 1, i, range);
				}
				result = fn.call(options.as, range[i], i, range);
				i += options.step;
			}
			
			if (result && callbacks.success) {
				callbacks.success.call(options.as, range, options.from, options.to);
			}
			else if (!result && callbacks.failure) {
				callbacks.failure.call(options.as, range, options.from, options.to, i);
			}

			return range;
		},



		//---------------------------------------------------------------------
		// filter (mutative), and filtered (pure)
		//---------------------------------------------------------------------
		filter: function(seq, options, pred, callbacks)
		{
			if (options instanceof Function) {
				callbacks = pred;
				pred = options;
				options = jam._default_range_options(seq);
			}
			else {
				options = jam._optionise(seq, options);
			}

			if (seq.length == 0)
				return seq;
			
			// filter elements, moving them "up" in the array steadily.
			// seq algorithm maintiains .length correctly between calls.
			var offset = 0, seq_length = seq.length, filtered = [];
			for (var i = options.from, ie = options.until; i != ie; ++i) {
				if (pred.call(seq, seq[i])) {
					if (offset > 0) {
						seq[i - offset] = seq[i];
					}
				}
				else {
					filtered.push(seq[i]);
					++offset;
					--seq.length;
				}
			}

			if (offset > 0) {
				// move trailing elements into correct spots
				for (var i = options.until; i != seq_length; ++i) {
					seq[i - offset] = seq[i];
				}

				// delete unused elements at the end
				for (var i = seq.length; i != seq_length; ++i) {
					delete seq[i];
				}
			}

			if (callbacks.with_filtered !== undefined) {
				callbacks.with_filtered(filtered);
			}

			return seq;
		},

		filtered: function(range, pred, callback_object)
		{
			callback_object = callback_object || this;
			if (Array.prototype.filter !== undefined) {
				return Array.prototype.filter.apply(callback_object, [pred]);
			}

			var result = jam.Array();
			this.each(function(x) {
				if (pred.apply(callback_object, [x]))
					result.push_back(x);
			});

			return result;
		},














		zip: function(lhs, rhs) {
			var result = [];
			
			$.each(lhs, function(i, x) {
				if (rhs[i] === undefined) { return false; }
				result.push([x, rhs[i]]);
			});

			return result;
		},

		fold: function(xs, f, init) {
			f = f || function(lhs, rhs) {
				return lhs + rhs;
			}

			var i = 0;
			if (init === undefined && xs.length > 1) {
				i = 1;
				init = xs[0];
			}

			for (var z = xs.length; i != z; ++i) {
				init = f(init, xs[i]);
			}
			
			return init;
		},
		
		map: function(xs, f)
		{
			var ys = [];
			if (Array.isArray(xs)) {
				for (var i = 0, z = xs.length; i != z; ++i) {
					ys.push(f(xs[i]));
				}
			}
			else {
				for (x in xs) {
					ys.push( f(x, xs[x]) );
				}
			}

			return ys;
		},

		arrays_equal: function(lhs, rhs) {
			var temp = new Array();
			
			// make sure it's an array, make sure lengths are same
			if ( !lhs[0] || !rhs[0] || lhs.length != rhs.length ) {
				return false;
			}
			
			for (var i = 0, ie = lhs.length; i != ie; ++i) {
				// false if they're not the same type
				var lhse = lhs[i], rhse = rhs[i], lhst = typeof lhse;
				if (lhst !== (typeof rhse)) {
					return false;
				}

				if (lhst === "object") {
					// if they're arrays, recurse!
					if ("length" in lhse && lhse[0] && "length" in rhse && rhse[0]) {
						if (!this.arrays_equal(lhse, rhse)) {
							return false;
						}
					}
					// otherwise... okay?
					else {
						//return false;
					}
				}
				else {
					if (lhse != rhse) {
						return false;
					}
				}
			}

			return true;
		},

		//=====================================================================
		// determines if lhs is a subset of rhs
		// EXPECTS SORTED ARRAYS
		//=====================================================================
		subset_of: function(lhs, rhs, pred) {
			pred = pred || jam.default_predicate;
			var i = 0, ie = lhs.length, j = 0, je = rhs.length, result = undefined;
			
			while (i != ie) {
				while (j != je && (result = pred(lhs[i], rhs[j])) > 0)
					++j;
				if (result !== 0) {
					return false;
				}
				++i;
				++j;
			}
			return true;
		},

		//=====================================================================
		// splits a jquery object consisting of multiple objects into an array of jquery objects,
		// each object containing a single object. if that makes sense.
		//=====================================================================
		jquery_split: function($o) {
			return jam.map($o.get(), function(x) {return $(x);});
		},

		assert: function(v, m) {
			if (v === false) {
				jam.assert.handler(m);
			}
		},


		//=====================================================================
		// binary search! :D
		//  guarantees: if not found, will return the index we could insert to
		//              and not mess up the order - similar to upper_bound.
		//              HOWEVER - if there are multiple equal values, will
		//              return a RANDOM valid index.
		//=====================================================================
		binary_search: function(range, pred, opt_bounds)
		{
			pred = pred || jam.default_predicate;
			var lbound = opt_bounds ? opt_bounds[0] : 0,
			    ubound = opt_bounds ? opt_bounds[1] : range.length,
			    r = null,
			    middle = 0
			    ;

			while (ubound - lbound > 0)
			{
				middle = (ubound + lbound) >> 1;
				
				r = pred(range[middle]);

				if (r == 0) {
					break;
				}
				else if (r < 0) {
					lbound = middle + 1;
				}
				else if (r > 0) {
					ubound = middle;
				}
			}

			if (r === -1) {
				++middle;
			}

			return {found: r === 0, value: middle};
		},

		//=====================================================================
		// searches for a particular element with an optional predicate
		//=====================================================================
		binary_search_for: function(range, element, pred, opt_bounds) {
			pred = pred || jam.default_predicate;
			return jam.binary_search(range, function(x) {
				return pred(x, element);
			}, opt_bounds);
		},

		//=====================================================================
		// returns true if a sorted array has duplicate values
		//=====================================================================
		has_duplicates: function(sorted_array)
		{
			for (var i = 0, ie = sorted_array.length; i != ie; ++i) {
				if (sorted_array[i+1] === undefined) break;
				if (sorted_array[i] === sorted_array[i+1]) {
					return true;
				}
			}
			return false;
		},

		//=====================================================================
		// merges two sorted arrays together
		//=====================================================================
		merge: function(lhs, rhs, pred)
		{
			var result = [],
			    lhs_length = lhs.length,
			    rhs_length = rhs.length
			    ;
			
			while(lhs_length != 0 && rhs_length != 0)
			{
				if (pred(lhs[0], rhs[0]) < 0) {
					result.push(lhs.shift());
					--lhs_length;
				}
				else {
					result.push(rhs.shift());
					--rhs_length;
				}
			}

			// one of these two arrays will have something left over
			for ( ; lhs_length != 0; --lhs_length)
				result.push(lhs.shift());	
			for ( ; rhs_length != 0; --rhs_length)
				result.push(rhs.shift());
			
			return result;
		},

		merge_inplace: function(array, begin, begin_right, end)
		{
			for (; begin < begin_right; ++begin) {
				if (array[begin] > array[begin_right]) {
					var v = array[begin];
					array[begin] = array[begin_right];
					//insert(array, begin_right, end, v);
					//array.splice(begin_right, 0, )
				}
			}
		}
	});


	$.extend(jam.assert, {
		default_handler: function(m) {
			console.error(m);
		},
	});

	jam.assert.handler = jam.assert.default_handler;


	if (Array.prototype.swap === undefined) {
		Array.prototype.swap = function(lhs, rhs) {
		    var t = this[lhs];
		    this[lhs] = this[rhs];
		    this[rhs] = t;
		    return this;
		};
	}
	else {
		console.error("Array.prototype.swap is alrady defined");
	}

	if (Array.prototype.remove === undefined) {
		Array.prototype.remove = function(from, to) {
		  var rest = this.slice((to || from) + 1 || this.length);
		  this.length = from < 0 ? this.length + from : from;
		  return this.push.apply(this, rest);
		};
	}
	else {
		console.error("Array.prototype.remove is already defined");
	}

	if (Array.prototype.unique === undefined) {
		Array.prototype.unique = function() {
		    var o = {}, i, l = this.length, r = [];
		    for(i = 0; i < l; i += 1) o[this[i]] = this[i];
		    for(i in o) r.push(o[i]);
		    return r;
		};
	}
	else {
		console.error("Array.prototype.unique is already defined");
	}
	


	//=====================================================================
	// Add 'partial' to Function's prototype
	//=====================================================================
	if (Function.prototype.partial === undefined)
	{
		Function.prototype.partial = function()
		{
			var fn = this, args = Array.prototype.slice.call(arguments);
			//console.log(fn + ": " + fn.length);
			return function()
			{
				for ( var i = 0, il = fn.length, j = 0, jl = arguments.length; i != il && j != jl; ++i) {
					if ( args[i] === undefined )
						args[i] = arguments[j++];
				}
				return fn.apply(this, args);
			};
		};
	}
	else {
		console.error("Function.prototype.partial is already defined");
	}
	



	//=====================================================================
	// this shit shouldn't be here
	//=====================================================================
	jam.ui = {};
	jam.page = {
		mousedown_position: {x: 0, y: 0},
		mouseup_position: {x: 0, y: 0}
	};
	
	$(window)
		.mousedown(function(event){
			jam.page.mousedown_position = {x: event.pageX, y: event.pageY};
		})
		.mouseup(function(event){
			jam.page.mouseup_position = {x: event.pageX, y: event.pageY};
		})
		;
	



	
	return jam;
	
})(jQuery);

















