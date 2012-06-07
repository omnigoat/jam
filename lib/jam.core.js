


var jam = (function($, undefined) {
	var jam = {};
	
	var p = new printStackTrace.implementation();
	
	//=====================================================================
	//
	//  TESTING
	//  =========
	//
	//=====================================================================
	$.extend(jam, {
		test: function()
		{
			var args = Array.prototype.slice.apply(arguments),
			    name = args.shift(),
			    fixtures = args[0].with_fixture ? args.shift().with_fixture() : [],
			    handler = args.with_handler || jam.test.default_handler
			    ;
			
			jam.each(args, function(x) {
				//console.log("doing:", x);
				p.instrumentFunction(jam.test, "BadCheckException", {guess: false, arguments: [x]}, function(x, stack) {
					if (x.should) {
						handler(name + " does not " + x.should, stack);
					}
					
					if (x.should_not) {
						handler(name + " does, incorrectly, " + x.should_not, stack);
					}
				});
				
				try {
					x.ie.apply(jam.test.checker, fixtures);
				}
				catch (e) {
				}
				
				p.deinstrumentFunction(jam.test, "BadCheckException");
			});
		}
	});
	
	$.extend(jam.test, {
		BadCheckException: function() {},
		
		default_handler: function(message, stack) {
			if (stack !== undefined)
				console.log(message, [ stack[1].match(/\((.+)\)/)[0] ]);
			else
				console.log(message);
		},
		
		checker: function(x) {
			return {
				_obj: x,
				
				should_not_be_undefined: function() {
					if (this._obj === undefined) throw new jam.test.BadCheckException;
					return this;
				},
				
				should_equal: function(x) {
					if (this._obj !== x) throw new jam.test.BadCheckException;
					return this;
				},

				should_equal_array: function() {
					if (!this.should_be_array_of(arguments.length)) throw new jam.test.BadCheckException;
					for (var i = 0, ie = arguments.length; i != ie; ++i) {
						if (typeof this._obj[i] != typeof arguments[i] || this._obj[i] !== arguments[i])
							throw new jam.test.BadCheckException;
					}
					return this;
				},
				
				should_be_array_of: function(n) {
					if (!this.should_be_array() || this._obj.length !== n)
						throw new jam.test.BadCheckException;
					return this;
				},
				
				should_be_array: function() {
					if (!Array.isArray(this._obj)) throw new jam.test.BadCheckException;
					return this;
				}
			}
		}
	});
	
	
	

	//=====================================================================
	//
	//
	//  CURRYING
	//  ==========
	//
	//=====================================================================
	$.extend(jam, {
		placeholder: function(i) {
			this.value = i;
		}
	});
	
	//var old_underscores = [_, _1, _2, _3, _4, _5, _6, _7, _8];
	
	_  = new jam.placeholder(undefined);
	_1 = new jam.placeholder(0);
	_2 = new jam.placeholder(1);
	_3 = new jam.placeholder(2);
	_4 = new jam.placeholder(3);
	_5 = new jam.placeholder(4);
	_6 = new jam.placeholder(5);
	_7 = new jam.placeholder(6);
	_8 = new jam.placeholder(7);

	

	$.extend(jam, {
		restore_underscore: function() {
			_ = old_underscores[0];
		},
		
		restore_placeholders: function() {
			_ = old_underscores[0];
			for (var i = 1, ie = old_underscores.length; i != ie; ++i) {
				window["_" + i] = old_underscores[i];
			}
		},
		
		
		curry: function()
		{
			var directives = Array.prototype.slice.call(arguments),
			    fn = directives.shift()
			    ;
			
			var uses_undefineds = false,
			    placeholders = 0,
			    placeholder_summation = 0
			    ;
			
			jam.each(directives, function() {
				if (this instanceof jam.placeholder) {
					if (this.value !== undefined) {
						jam.assert_throw(!uses_undefineds,
							"jam.curry: Numbered placeholders may not follow non-numbered placeholders (i.e: _1 may not follow _)"
						);
						++placeholders;
						placeholder_summation += this.value;
					}
					else { 
						uses_undefineds = true;
					}
				}
			});
			
			jam.assert_throw(placeholder_summation == placeholders * (placeholders - 1) / 2,
				"jam.curry: Incorrect sequence of placeholders"
			);
			
			return function()
			{
				var args = Array.prototype.slice.apply(arguments),
				    final_args = [],
				    placeholders = 0,
				    undefineds = 0
				    ;
				
				jam.each(directives, function(directive) {
					if ( directive instanceof jam.placeholder ) {
						if (directive.value === undefined) {
							final_args.push(args[placeholders + undefineds++]);
						}
						else {
							final_args.push(args[directive.value]);
							++placeholders;
							placeholder_summation += directive.value;
						}
					}
					else {
						final_args.push(directive);
					}
				});
				
				jam.each(args, {from: placeholders + undefineds}, function(x) {
					final_args.push(x);
				});
				
				return fn.apply(this, final_args);
			};
		},
	

		bind: function(fn, this_object) {
			return function() {
				return fn.apply(this_object, Array.prototype.slice.call(arguments));
			}
		}
	});

	















	//=====================================================================
	//
	//
	//
	//=====================================================================
	jam.proxies = {};
	$.extend(jam.proxies, {
		//---------------------------------------------------------------------
		// make takes a no-op handler, and extends it by our specified handler.
		//---------------------------------------------------------------------
		make: function(handler, proto) {
			return Proxy.create($.extend({
				getOwnPropertyDescriptor: function(name) {
					var desc = Object.getOwnPropertyDescriptor(this, name);
					if (desc !== undefined) { desc.configurable = true; }
					return desc;
				},
				getPropertyDescriptor:	function(name) {
					var desc = Object.getOwnPropertyDescriptor(this, name);
					if (desc !== undefined) { desc.configurable = true; }
					return desc;
				},
				getOwnPropertyNames: function() {
					return Object.getOwnPropertyNames(this);
				},
				getPropertyNames: function() {
					return Object.getPropertyNames(this);
				},
				defineProperty: function(name, desc) {
					Object.defineProperty(this, name, desc);
				},
				delete: function(name) { return delete this[name]; },	 
				fix: function() {
					if (Object.isFrozen(this)) {
						return Object.getOwnPropertyNames(this).map(function(name) {
							return Object.getOwnPropertyDescriptor(this, name);
						});
					}
					// As long as this is not frozen, the proxy won't allow itself to be fixed
					return undefined; // will cause a TypeError to be thrown
				},
			 
				// derived traps
				has: function(name) { return name in this; },
				hasOwn: function(name) { return Object.prototype.hasOwnProperty.call(this, name); },
				get: function(receiver, name) { return receiver[name]; },
				set: function(receiver, name, val) { receiver[name] = val; return true; },
				enumerate: function() {
					var result = [];
					for (name in this) { result.push(name); };
					return result;
				},
				keys: function() { return Object.keys(this) }
			}, handler), proto);
		}
	});


	

















	//=====================================================================
	//
	//
	//  PROTOTYPING
	//  =============
	//
	//
	//   okay, so:
	//     Class.__def__:  the stored definitions
	//       (ie, object.__def__.accessors == the accessors that were originally defined)
	//     object
	//
	//
	//=====================================================================
	$.extend(jam, {
		prototype: function(definitions)
		{
			//---------------------------------------------------------------------
			// constructor function
			//---------------------------------------------------------------------
			function jam_Object() {
				jam_Object.prototype.__init__ && 
					jam_Object.prototype.__init__.apply(this, arguments);
				return this;
			};
			

			//---------------------------------------------------------------------
			// store the definition
			//---------------------------------------------------------------------
			Object.defineProperty(jam_Object, "__def__", {value: definitions});
			jam_Object.__def__.super = jam_Object.__def__.super || Object;


			//---------------------------------------------------------------------
			// set up proxy for method missing
			//---------------------------------------------------------------------
			if (jam_Object.__def__.method_missing && Proxy) {
				var supr = jam_Object.__def__.super;
				
				jam_Object.prototype = Object.create(
					jam.proxies.make({
						get: function(receiver, name) {
							if (supr.prototype[name] !== undefined) {
								return supr.prototype[name];
							}
							else {
								return receiver.__method_missing__(name);
							}
						}
					})
				);

				Object.defineProperty(jam_Object.prototype, "__method_missing__", {value: definitions.method_missing});
			}


			//---------------------------------------------------------------------
			// accessors
			//---------------------------------------------------------------------
			jam.each(jam_Object.__def__.accessors, function(k, v) {
				jam.assert(v !== null, "jam.prototype: accessor can't be null!");

				Object.defineProperty(jam_Object.prototype, k, {
					get: v instanceof Function ? v : v.get,
					set: v instanceof Function ? undefined : v.set,
					enumerable: k.match(/^_/) == null,
					configurable: true
				});
			});


			//---------------------------------------------------------------------
			// methods
			//---------------------------------------------------------------------
			jam.each(jam_Object.__def__.methods, function(k, v) {
				Object.defineProperty(jam_Object.prototype, k, {
					value: v,
					writable: true,
					enumerable: k.match(/^_/) == null
				});
			});
			

			//---------------------------------------------------------------------
			// static methods
			//---------------------------------------------------------------------
			jam.each(jam_Object.__def__.statics, function(k, v) {
				jam_Object[k] = v;
			});
			

			//---------------------------------------------------------------------
			// define function for adding members/accessors
			//---------------------------------------------------------------------
			Object.defineProperty(jam_Object.prototype, "_define_members", {
				value: function(map) {
					jam.each(map, {this_object: this}, function(k, v) {
						Object.defineProperty(this, k, {
							value: v,
							configurable: true,
							writable: true,
							enumerable: k.match(/^_/) == null
						});
					});
				}
			});

			Object.defineProperty(jam_Object.prototype, "_define_accessors", {
				value: function(map) {
					jam.each(map, {this_object: this}, function(k, v) {
						Object.defineProperty(this, k, {
							get: v instanceof Function ? v : v.get,
							set: v instanceof Function ? undefined : v.set,
							enumerable: k.match(/^_/) == null
						});
					});
				}
			});

			Object.defineProperty(jam_Object.prototype, "_mixin", {
				value: function(mixin) {
					jam.each(mixin, {this_object: this}, function(k, v) {
						Object.defineProperty(this, k, {
							get: v instanceof Function ? v : v.get,
							set: v instanceof Function ? undefined : v.set,
							enumerable: k.match(/^_/) == null
						});
					});
				}
			});
			

			//---------------------------------------------------------------------
			// rearrange __init__ to call superclasses first. then apply our datas.
			// this naturally (since we're calling superclasses' __init__), applies
			// the superclasses datas before us.
			//---------------------------------------------------------------------
			var old_init = definitions.init;
			
			if (old_init) {
				Object.defineProperty(jam_Object.prototype, "__init__", {
					value: function()
					{
						// re-jig things so that the first argument to __init__ is the
						// function super.__init__ (if it exists).
						var args = Array.prototype.slice.call(arguments);
						if (jam_Object.__def__.super.prototype.__init__)
							args.unshift(jam_Object.__def__.super.prototype.__init__);
						
						old_init && old_init.apply(this, args);
					}
				});
			}
			

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
			return lhs < rhs;
		},

		//=====================================================================
		// call a function asynchronously
		//=====================================================================
		async: function(fn) {
			setTimeout(fn, 0);
		},
	});

	
	//=====================================================================
	// reify?
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
		}
	});



	//=====================================================================
	// PROFILING
	//=====================================================================
	$.extend(jam, {
		profile: function(fn) {
			var start = (new Date).getTime(),
			    result = fn(),
			    end = (new Date).getTime(),
			    elapsed_time = end - start
			    ;
			
			console.log("result:", result);
			console.log("time:", elapsed_time + "ms");
		}
	});





















	//=====================================================================
	//
	//
	//  ARRAY UTILITIES
	//  =================
	//
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
			return range.length !== undefined && !(range.length instanceof Function);
		},
		
		if_all: function(array, predicate, success, fail) {
			for (var i = 0, ie = array.length; i != ie; ++i) {
				if ( !predicate.call(array[i]) ) {
					fail && fail.call(array);
					return false;
				}
			}
			success && success.call(array);
			return true;
		},
		
		if_any: function(array, predicate, success, fail) {
			return jam.if_all(array, function() {
				return !predicate.call(this);
			}, fail, success);
		},

		object_to_array: function(x) {
			var r = [];
			for (var p in x) {
				r.push(p);
			}
			return r;
		},


		//---------------------------------------------------------------------
		// insert
		//---------------------------------------------------------------------
		insert: function(arraylike, index, elements)
		{
			index = jam._reindex(arraylike, index);

			var elements_length = elements.length,
			    i = arraylike.length - 1,
			    ie = index - 1,
			    j = elements_length - 1,
			    je = -1
			    ;
			
			for (; i != ie; --i) {
				arraylike[i + elements_length] = arraylike[i];
			}

			for (i = index + j; j != je; --i, --j) {
				arraylike[i] = elements[j];
			}

			// inbuilt arrays automagically update their length
			if (!Array.isArray(arraylike)) {
				arraylike.length += elements_length;
			}
			
			return arraylike;
		},


		//---------------------------------------------------------------------
		// each
		//---------------------------------------------------------------------
		each: function(range, options, fn, callbacks)
		{
			return jam._each(range, options, fn, callbacks);
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
				callbacks.success.call(options.as, range, options.from, options.until);
			}
			else if (!result && callbacks.failure) {
				callbacks.failure.call(options.as, range, options.from, options.until, i);
			}

			return range;
		},

		_each_in_range: function(range, options, fn, callbacks)
		{
			jam.assert_throw(options.from <= options.until, "options.from is greater than options.until!");

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
				callbacks = f;
				f = options;
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
		fold: function(xs, options, f, init) {
			return jam._fold(xs, options, f, init);
		},

		_fold: function(xs, options, fn, init)
		{
			if (options instanceof Function) {
				init = fn;
				fn = options;
				options = jam._default_range_options(xs);
			}
			else {
				options = jam._optionise(xs, options);
			}

			fn = fn || function(lhs, rhs) {
				return lhs + rhs;
			}

			var i = 0;
			if (init === undefined && xs.length > 1) {
				i = 1;
				init = xs[0];
			}

			for (var z = xs.length; i != z; ++i) {
				init = fn.call(xs, init, xs[i], i);
			}
			
			return init;
		},





		//=====================================================================
		//
		//    SET THINGS
		//
		//
		//=====================================================================
		intersection_of: function() {
			var args = Array.prototype.slice.apply(arguments),
			    result = [],
			    indices = []
			    ;

			for (var x = 0; x < args.length; ++x)
				indices.push(0);

			while (args.length > 1)
			{
				var eiq = args[0][indices[0]],
				    all_present = true,
				    one_exhausted = false
				    ;

				for (var i = 1, xe = args.length; i != xe; ++i)
				{
					var set = args[i], index = indices[i];
				
					// make sure we are pointing to the element in each set that
					// is the smallest possible element equal-to or larger-than eiq
					while (index != set.length && set[index] < eiq) {
						index = ++indices[i];
					}

					// if we're all out of love, then this and all future elements
					// can not possibly be in this set, and thus the intersection
					if (index == set.length) {
						one_exhausted = true;
						all_present = false;
						break;
					}
					else if (set[index] !== eiq) {
						all_present = false;
					}
				}

				if (all_present) {
					result.push(eiq);

					// increment the indices
					indices = jam.map(indices, function(x) {return x + 1;});
					// check if one of our sets is exhausted
					if (!jam.fold(indices, function(lhs, rhs, rhsi) {return lhs && (rhs != args[rhsi].length);}, true)) {
						one_exhausted = true;
					}
				}
				else {
					++indices[0];
				}

				if (one_exhausted)
					break;
			}

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
				jam.assert.handler(m ? m : "Jam: an error occurred!");
			}
		},
		
		assert_throw: function(v, m) {
			if (v === false) {
				throw m;
			}
		},
		
		AssertException: function(m) {
			this.message = m;
		},


		//=====================================================================
		// binary search
		// ---------------
		//   @pred is a predicating function that takes a single element, and
		//   returns -1 if the element is smaller than required, 0 for a match,
		//   and +1 for when the element is greater than required.
		//
		//   If no match is found, will return the index we could insert to
		//   and not mess up the order.
		//=====================================================================
		binary_search: function(sorted_range, pred, opt_bounds)
		{
			jam.assert(sorted_range !== undefined, "range is undefined");
			
			opt_bounds = pred instanceof Function ? (opt_bounds || [0, sorted_range.length]) : pred;
			pred = pred instanceof Function ? pred : jam.default_predicate;
			
			var lbound = opt_bounds[0]
			    ubound = opt_bounds[1],
			    r = null,
			    middle = 0
			    ;

			while (ubound - lbound > 0)
			{
				middle = (ubound + lbound) >> 1;
				
				r = pred(sorted_range[middle]);

				if (r === 0)
					break;
				else if (r < 0)
					lbound = middle + 1;
				else
					ubound = middle;
			}

			while (r === -1) {
				++middle;
				if (middle >= opt_bounds[1]) break;
				r = pred(sorted_range[middle]);
			}

			return {found: r === 0, index: middle};
		},


		//=====================================================================
		// searches for a particular element with an optional predicate
		//=====================================================================
		binary_search_for: function(sorted_range, element, pred, opt_bounds) {
			opt_bounds = pred instanceof Function ? undefined : pred;
			pred = pred instanceof Function ? pred : jam.default_predicate;
			return jam.binary_search(sorted_range, function(x) {
				return pred(x, element) ? -1 : pred(element, x) ? 1 : 0;
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
			console.warn(m);
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




(function(undefined) {
	
	jam.test("jam.curry()",
		{with_fixture: function() {
			return [function(a, b, c, d) {return [a, b, c, d];}];
		}},
		
		{should: "curry trailing undefined arguments", ie: function(f) {
			this(jam.curry(f, 1, 2)(3, 4))
				.should_equal_array(1, 2, 3, 4);
		}},
		
		{should: "curry intermittent underscores", ie: function(f) {
			this(jam.curry(f, _, 2, _, 4)(1, 3))
				.should_equal_array(1, 2, 3, 4);
		}},
		
		{should: "throw when a non-sequential use of placeholders occurs", ie: function(f) {
			this.should_throw(function() {
				jam.curry(f, _1, _2, _4, 4);
			});
		}},
		
		{should: "throw when placeholders follow underscores", ie: function(f) {
			this.should_throw(function() {
				jam.curry(f, _, _, _1, _2);
			});
		}},
		
		{should_not: "throw when underscores follow placeholders", ie: function(f) {
			this.should_not_throw(function() {
				jam.curry(f, _2, _1, _, _);
			});
		}},
		
		{should: "correctly curry placeholders", ie: function(f) {
			this(jam.curry(f, _3, _1, _2)(2, 3, 1, 4))
				.should_equal_array(1, 2, 3, 4);
		}}
	);



	jam.test("jam.binary_search()",
		{with_fixture: function() {
			return [[1, 2, 4, 5]];
		}},

		{should: "find existing element", ie: function(a) {
			var k = jam.binary_search_for(a, 2);
			if (!k.found || k.index != 1)
				throw new jam.test.BadCheckException;				
		}},

		{should: "find last element", ie: function(a) {
			var k = jam.binary_search_for(a, 5);
			if (!k.found || k.index != 3)
				throw new jam.test.BadCheckException;				
		}},

		{should: "return a correct index for a non-match", ie: function(a) {
			var k = jam.binary_search_for(a, 3);
			if (k.found || k.index != 2)
				throw new jam.test.BadCheckException;
		}},

		{should: "return a correct index for a trailing non-match", ie: function(a) {
			var k = jam.binary_search_for(a, 6);			
			if (k.found || k.index != 4)
				throw new jam.test.BadCheckException;
		}},

		{should: "return a correct index for a preceding non-match", ie: function(a) {
			var k = jam.binary_search_for(a, 0);
			if (k.found || k.index != 0)
				throw new jam.test.BadCheckException;
		}}
	);

})();




//=====================================================================
// Indexable
//=====================================================================
// jam.Indexable = jam.prototype({
// methods: {
// 	__init__: function() {
// 		$.extend(this, {
// 			_reindex: jam.curry(jam._reindex, this),
// 			_optionise: jam.curry(jam._optionise, this),
// 			_default_range_options: jam.curry(jam._default_range_options, this)
// 		});
// 	},
	
// 	__is_jam_Indexable__: {}
// }});




