


var jaja = (function($, undefined) {
	
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

	var jaja = {};


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
		jaja.page = {scrollbar_width: wNoScroll - wScroll};
	});




	//=====================================================================
	// CORE UTILITIES
	//=====================================================================
	$.extend(jaja, {
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
	$.extend(jaja, {
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
		
		filter: function(xs, f) {
			var ys = [];
			for (var i = 0, z = xs.length; i != z; ++i) {
				if (f(xs[i])) {
					ys.push(xs[i]);
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
			pred = pred || jaja.default_predicate;
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
			return jaja.map($o.get(), function(x) {return $(x);});
		},

		assert: function(v, m) {
			if (v === false) {
				jaja.assert.handler(m);
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
			pred = pred || jaja.default_predicate;
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
			pred = pred || jaja.default_predicate;
			return jaja.binary_search(range, function(x) {
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


	$.extend(jaja.assert, {
		default_handler: function(m) {
			console.error(m);
		},
	});

	jaja.assert.handler = jaja.assert.default_handler;


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
	jaja.ui = {};
	jaja.page = {
		mousedown_position: {x: 0, y: 0},
		mouseup_position: {x: 0, y: 0}
	};
	
	$(window)
		.mousedown(function(event){
			jaja.page.mousedown_position = {x: event.pageX, y: event.pageY};
		})
		.mouseup(function(event){
			jaja.page.mouseup_position = {x: event.pageX, y: event.pageY};
		})
		;
	



	
	return jaja;
	
})(jQuery);



