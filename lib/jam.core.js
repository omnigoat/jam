


var jam = (function($, undefined) {
	//=====================================================================
	// add funcitonality to jQuery.
	// SERIOUSLY, remove this
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

	//=====================================================================
	// things for currying. hooray!
	//=====================================================================
	$.extend(jam, {
		placeholder: function(i) {
			this.value = i;
		},

		identity: function() {}
	});
	

	_  = undefined;
	_1 = new jam.placeholder(0);
	_2 = new jam.placeholder(1);
	_3 = new jam.placeholder(2);
	_4 = new jam.placeholder(3);
	_5 = new jam.placeholder(4);
	_$ = new jam.identity();


	








	$.extend(jam, {
		prototype: function(definitions)
		{
			function jam_Object() {
				if (this.constructor == jam_Object) {
					return this;
				}
				var self = new jam_Object;
				jam_Object.prototype.__init__.apply(self, arguments);
				return self;
			};
		
			// store the superclasses for later initialisation, and then steal all their protics
			if (definitions.supers)
			{
				Object.defineProperty(jam_Object.prototype, "__supers__", {value: definitions.supers});
				
				jam.for_each_depth_first(jam_Object, function() {
					for (var p in this.prototype.__protics__) {
						if (p.match(/^__(.+)__$/) === null) {
							Object.defineProperty(jam_Object.prototype, p, {
								value: this.prototype.__protics__[p],
								writable: true,
								enumerable: p.match(/^_/) == null
							});
						}
					}
					
					jam.each(this.prototype.__accers__, function(k, v) {
						Object.defineProperty(jam_Object.prototype, k, {
							get: v instanceof Function ? v : v.get,
							set: v instanceof Function ? undefined : v.set,
							enumerable: k.match(/^_/) == null
						});
					});
				},
				
				function() {
					return this.prototype.__supers__;
				});
			}

			// taking goes first, as we overwrite properties with our children
			/*
			if (definitions.taking)
			{
				for (i = 0, ie = definitions.taking.length; i != ie; ++i)
				{
					var taking = definitions.taking[i];
					if (taking.from === undefined) continue;
					for (var member in taking.from.prototype) {
						if (member.match(/^__(.+)__$/) === null) {
							if (taking.these === undefined || taking.these.indexOf(member) !== -1) {
								if (taking.excluding === undefined || taking.excluding.indexOf(member) === -1) {
									jam_Object.prototype[member] = taking.from.prototype[member];
								}
							}
						}
					}
				}
			}
			*/
			
			if (definitions.datas) {
				Object.defineProperty(jam_Object.prototype, "__datas__", {value: definitions.datas});				
			}
			
			if (definitions.accers) {
				Object.defineProperty(jam_Object.prototype, "__accers__", {value: definitions.accers});
			}
			

			if (definitions.protics) {
				Object.defineProperty(jam_Object.prototype, "__protics__", {value: definitions.protics});
				
				for (var x in definitions.protics) {
					Object.defineProperty(jam_Object.prototype, x, {
						value: definitions.protics[x],
						writable: true,
						enumerable: x.match(/^_/) == null
					});
				}
			}
			
			if (definitions.statics) {
				for (var x in definitions.statics) {
					jam_Object[x] = definitions.statics[x];
				}
			}
			
			// rearrange __init__ to call superclasses first. then apply our datas.
			// this naturally (since we're calling superclasses' __init__), applies
			// the superclasses datas before us.
			var old_init = definitions.protics ? definitions.protics.__init__ : null;
			
			Object.defineProperty(jam_Object.prototype, "__init__", {
				value: function()
				{
					var self = this;
					jam.each(jam_Object.prototype.__supers__, function() {
						this.prototype.__init__.apply(self, arguments);
					});
					
					if (jam_Object.prototype.__datas__) {
						jam.each(jam_Object.prototype.__datas__, function(k, v) {
							Object.defineProperty(self, k, {
								value: v,
								writable: true,
								enumerable: k.match(/^_/) == null
							});
						});
					}
					
					old_init && old_init.apply(this, arguments);
				}
			});
			

			return jam_Object;
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


	if (!Array.isArray) {
		Array.isArray = function (arg) {	
			return Object.prototype.toString.call(arg) == '[object Array]';	
		};	
	}	

	
	//=====================================================================
	// FUNCTION CURRYING & BINDING
	//=====================================================================
	$.extend(jam, {
		reify: function(name) {
			if (name.match(/\w+(\.\w+)*/) == null)
				return;
			
			var things = name.split(".");
			var result = window[things.shift()];
			while (result !== undefined && things.length > 0) {
				result = result[things.shift()];
			}
			
			return result;
		},
		
		curry: function()
		{
			var args = Array.prototype.slice.call(arguments),
			    fn = args.shift()
			    ;
			
			return function()
			{
				var final_args = [],
				    used_placeholders = false,
				    used_undefined = false
				    ;
				
				for ( var i = 0, il = fn.length, j = 0, jl = arguments.length; i != il && j != jl; ++i) {
					if ( args[i] === undefined ) {
						if (used_placeholders) console.error("jam.curry: Can't mix and match undefined and placeholders");
						final_args[i] = arguments[j++];
						used_undefined = true;
					}
					else if ( args[i] instanceof jam.placeholder ) {
						if (used_undefined) console.error("jam.curry: Can't mix and match undefined and placeholders");
						final_args[i] = arguments[args[i].value];
						used_placeholders = true;
					}
					else
						final_args[i] = args[i];
				}
				return fn.apply(this, final_args);
			};
		},
	

		bind: function(this_object) {
			var fn = this;
			return function() {
				return fn.apply(this_object, Array.prototype.slice.call(arguments));
			}
		}
	});



	//=====================================================================
	// PROFILING
	//=====================================================================
	$.extend(jam, {
		profile: function(fn) {
			var start = (new Date).getTime();
			fn();
			console.log("time: " + ((new Date).getTime() - start) + "ms");
		}
	});





















	//=====================================================================
	// ARRAY UTILITIES
	//=====================================================================
	$.extend(jam, {
		IterationBreakException: {},

		_default_applicator: function(fn, this_object, args) {
			return fn.apply(this_object, args);
		},

		_default_range_options: function(range) {
			return {
				from: 0,
				until: range.length,
				step: 1,
				applicator: range._default_applicator || jam._default_applicator,
				only_own_properties: true
			};
		},

		_reindex: function(range, i) {
			i = i === undefined ? range.length : i;
			return i >= 0 ? i : i + range.length + 1;
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
		// something is iterable if it has a .length property
		//---------------------------------------------------------------------
		is_iterable: function(range) {
			return range.length !== undefined;
		},




		//---------------------------------------------------------------------
		// each
		//---------------------------------------------------------------------
		each: function(range, options, fn, callbacks)
		{
			if (range)
				if (range.each)
					return range.each(options, fn, callbacks);
				else
					return jam._each(range, options, fn, callbacks);
			else
				return range;
		},
		
		_each: function(range, options, fn, callbacks)
		{
			if (range === undefined) {
				return range;
			}
			else if (options instanceof Function) {
				callbacks = fn;
				fn = options;
				options = jam._default_range_options(range);
			}
			else {
				options = jam._optionise(range, options);
			}
			callbacks = callbacks || {};

			result = (jam.is_iterable(range) ? jam._each_in_range : jam._each_in_object)(range, options, fn, callbacks);
			
			if (result && callbacks.success) {
				callbacks.success.call(options.as, range, options.from, options.to);
			}
			else if (!result && callbacks.failure) {
				callbacks.failure.call(options.as, range, options.from, options.to, i);
			}

			return range;
		},

		_each_in_range: function(range, options, fn, callbacks)
		{
			// under certain circumstances, we can pass through to Array.forEach
			var result = true;
			if (options.from == 0 && options.until == range.length)
			{
				Array.prototype.forEach.call(range, function(x, i, a) {
					if (i !== 0 && callbacks.between) {
						callbacks.between.call(options.this_object || range[i - 1], range[i - 1], range[i], i - 1, i, range);
					}

					if (options.applicator(fn, options.this_object || x, [x, i, a]) === false) {
						// hmm
					}
				});
			}
			else {
				// implement own (slower) for-each function, however it allows us to iterate over
				// only subsections of an array, whilst providing
				var i = options.from, ie = options.until;
				while (i !== ie && result !== false) {
					if (i !== options.from && callbacks.between) {
						callbacks.between.call(options.as, range[i - 1], range[i], i - 1, i, range);
					}
					result = options.applicator(fn, options.this_object || range[i], [range[i], i, range]);
					i += options.step;
				}
			}

			return result;
		},

		_each_in_object: function(range, options, fn, callbacks)
		{
			var result = true;
			for (var p in range) {
				if ( options.only_own_properties === true && !range.hasOwnProperty(p) ) continue;
				result = options.applicator(fn, options.this_object || {key: p, value: range[p]}, [p, range[p], range]);
			}
			return result;
		},




		//---------------------------------------------------------------------
		// filter (mutative), and filtered (pure)
		//---------------------------------------------------------------------
		filter: function(seq, options, pred, callbacks)
		{
			if (!Array.isArray(seq) && seq.filter)
				return seq.filter(options, pred, callbacks);
			else
				return jam._filter(seq, options, pred, callbacks);
		},



		_filter: function(seq, options, pred, callbacks)
		{
			if (options instanceof Function) {
				callbacks = pred;
				pred = options;
				options = jam._default_range_options(seq);
			}
			else {
				options = jam._optionise(seq, options);
			}

			if (seq.length == 0 || options.until - options.from == 0)
				return seq;
			
			// we can use the inbuilt Array.prototype.filter under certain circumstances
			if (Array.isArray(seq) && options.from == 0 && options.until == seq.length && Array.prototype.filter) {
				Array.prototype.filter.call(seq, pred, options.this_arg);
			}
			

			var offset = 0, seq_length = seq.length, filtered = [];
			for (var i = options.from, ie = options.until; i != ie; ++i)
			{
				if (pred.call(seq, seq[i], i, seq)) {
					if (offset > 0) {
						seq[i - offset] = seq[i];
					}
				}
				else {
					filtered.push(seq[i]);
					++offset;
				}				
			}
			
			// move trailing elements into correct spots
			if (offset > 0) {
				for (var i = options.until; i != seq_length; ++i) {
					seq[i - offset] = seq[i];
				}
			}

			// if this IS an actual array (Array.isArray == true), then this will delete the trailing
			// properties automagically
			seq.length -= offset;

			// if this is NOT an actual array, then we delete the trailing properties
			if (offset > 0 && !Array.isArray(seq)) {
				for (var i = seq_length - offset; i != seq_length; ++i)
					delete seq[i];
			}



			if (callbacks.with_filtered !== undefined) {
				callbacks.with_filtered(filtered);
			}

			return seq;
		},

		filtered: function(range, options, pred, callbacks)
		{			
			if (!Array.isArray(seq) && seq.filtered)
				return range.filtered(options, pred, callbacks);
			else
				return jam._filtered(range, options, pred, callbacks);
		},

		_filtered: function(range, options, pred, callbacks)
		{
			if (options instanceof Function) {
				callbacks = pred;
				pred = options;
				options = jam._default_range_options(seq);
			}
			else {
				options = jam._optionise(seq, options);
			}


			if (Array.prototype.filter !== undefined) {
				return Array.prototype.filter.call(options.this_object, pred);
			}

			var result = jam.Array();
			jam.each(range, function(x, i, r) {
				if (options.applicator(pred, options.this_object, [x, i, r]))
					result.push_back(x);
			});

			return result;
		},




		//---------------------------------------------------------------------
		// map
		//---------------------------------------------------------------------
		map: function(xs, options, f)
		{
			if (!Array.isArray(xs) && xs.map)
				return xs.map(options, f);
			else
				return jam._map(xs, options, f);
		},

		_map: function(xs, options, f)
		{
			if (options instanceof Function) {
				callbacks = pred;
				pred = options;
				options = jam._default_range_options(xs);
			}
			else {
				options = jam._optionise(xs, options);
			}

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




		//---------------------------------------------------------------------
		// fold
		//---------------------------------------------------------------------
		fold: function(xs, otpions, f, init) {
			if (!Array.isArray(xs) && xs.fold)
				return xs.fold(options, f);
			else
				return jam._fold(xs, options, f);
		},

		_fold: function(xs, options, f, init)
		{
			if (options instanceof Function) {
				callbacks = pred;
				pred = options;
				options = jam._default_range_options(xs);
			}
			else {
				options = jam._optionise(xs, options);
			}

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










		zip: function(lhs, rhs) {
			var result = [];
			
			$.each(lhs, function(i, x) {
				if (rhs[i] === undefined) { return false; }
				result.push([x, rhs[i]]);
			});

			return result;
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
		
		
		
		for_each_depth_first: function(thing, fn, childgetter) {
			jam.each( childgetter.call(thing, thing), function() {
				jam.for_each_depth_first.call(this, this, fn, childgetter);
			});
			fn.call(thing);
		},




		//=====================================================================
		// determines if lhs is a subset of rhs
		// EXPECTS SORTED ARRAYS
		//=====================================================================
		is_subset_of: function(lhs, rhs, pred) {
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
				jam.assert.handler(m || "Jam: an error occured!");
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
	



	

	return jam;
	
})(jQuery);




//=====================================================================
// Indexable
//=====================================================================
jam.Indexable = jam.prototype({
protics: {
	__init__: function() {
		$.extend(this, {
			_reindex: jam.curry(jam._reindex, this),
			_optionise: jam.curry(jam._optionise, this),
			_default_range_options: jam.curry(jam._default_range_options, this)
		});
	},
	
	__is_jam_Indexable__: {}
}});


