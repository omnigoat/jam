


var jam = (function(undefined) {

	//=====================================================================
	//
	//  JAM HEART
	//  -----------
	//
	//=====================================================================
	var jam =
	{
		//---------------------------------------------------------------------
		// global config
		//---------------------------------------------------------------------
		config: {
			is_enumerable: /^[^_]/,
			accessor_regex: /^([\w_]+)(\?)?\s+->\s+([\w_]+)$/
		},


		//---------------------------------------------------------------------
		// assert!
		//---------------------------------------------------------------------
		assert: function(v, m) {
			if (v === false) {
				throw new Error(m || "Jam: an error occurred!");
			}
		},


		//---------------------------------------------------------------------
		// for currying
		//---------------------------------------------------------------------
		placeholder: function(i) {
			this.value = i;
		},


		//---------------------------------------------------------------------
		// default predicate
		//---------------------------------------------------------------------
		default_predicate: function(lhs, rhs) {
			return lhs < rhs;
		},

		
		//---------------------------------------------------------------------
		// simpler than jQuery.extend, but we do not wish for the functionality
		//---------------------------------------------------------------------
		extend: function(target)
		{
			for (var i = 1, ie = arguments.length; i != ie; ++i )
			{
				var src, name, element;
				if ( (src = arguments[i]) != null ) {
					
					for (name in src)
					{
						element = src[name];

						if (target !== element) {
							if (element !== undefined) {
								target[name] = element;
							}
							else {
								delete target[name];
							}
						}
					}
				}
			}

			return target;
		},



		//---------------------------------------------------------------------
		// properties
		//---------------------------------------------------------------------
		define_accessor: function(object, k, v) {
			jam.assert(v !== undefined, "jam.define_accessor: accessor can't be undefined!");
			jam.assert(v !== null, "jam.define_accessor: accessor can't be null!");
			k = k.toString();
			
			Object.defineProperty(object, k,
				jam.extend(
					{enumerable: k.match(jam.config.is_enumerable)},
					(v instanceof Function) ? {get: v} : v
				)
			);
		},

		define_accessors: function(object, accessors) {
			jam.each_in_object(accessors, jam.curry(jam.define_accessor, object, _2, _1));
		},

		define_member: function(object, k, v, o) {
			v = v || (o && o.value);
			jam.assert(v !== undefined, "jam.define_member: member can't be undefined!");
			k = k.toString();
			
			Object.defineProperty(object, k,
				jam.extend({enumerable: k.match(jam.config.is_enumerable), value: v}, o)
			);
		},

		define_members: function(object, members, config) {
			jam.each_in_object(members, jam.curry(jam.define_member, object, _2, _1, config));
		},





		//---------------------------------------------------------------------
		// IterationBreakException
		// -------------------------
		//   thrown internally when a user pre-emptively breaks from iterating
		//   within a function (i.e: each, filter)
		//---------------------------------------------------------------------
		IterationBreakException: function(){},

		//---------------------------------------------------------------------
		// each
		// ------
		//   Applies fn against each element in sequence. Calling return with
		//   any value other than undefined will halt execution.
		//
		//   @definitely_is_array is used internally
		//---------------------------------------------------------------------
		each: function(range, this_object, fns, definitely_is_array)
		{
			if (!range) {
				return undefined;
			}
			else if (this_object instanceof Function) {
				fns = {apply: this_object};
				this_object = undefined;
			}
			else if (fns === undefined) {
				fns = this_object;
				this_object = undefined;
			}

			if (fns instanceof Function) {
				fns = {apply: fns};
			}
			
			var delegate;
			if (definitely_is_array === undefined) {
				delegate = "length" in range ? jam._each_in_array : jam._each_in_object;
			}
			else if (definitely_is_array)
				delegate = jam._each_in_array;
			else
				delegate = jam._each_in_object;

			result = delegate(range, this_object, fns.apply, fns.between);
			
			var retval;
			if (result.completed && fns.completed) {
				return fns.completed.call(undefined, range) || result.value;
			}
			else if (!result.completed && fns.broke) {
				return fns.broke.call(undefined, result.value, range[result.index], result.index, range) || result.value;
			}

			return result.value;
		},

		
		each_in_array: function(range, this_object, fns) {
			return jam.each(range, this_object, fns, true);
		},

		_each_in_array: function(range, this_object, fn, betweener)
		{
			// under certain circumstances, we can pass through to Array.forEach
			try {
				var index = 0,
				    result
				    ;

				Array.prototype.forEach.call(range, function(x, i) {
					index = i;
					if (i !== 0 && betweener) {
						betweener.call(this_object, range[i - 1], x, i, range);
					}

					if ((result = fn.call(this_object, x, i, range)) !== undefined) {
						throw new jam.IterationBreakException;
					}
				});

				return {completed: true};
			}
			catch (e) {
				if (!(e instanceof jam.IterationBreakException)) {
					throw e;
				}

				return {completed: false, index: index, value: result};
			}
		},

		each_in_object: function(range, this_object, fns) {
			return jam.each(range, this_object, fns, false);
		},

		_each_in_object: function(range, this_object, fn)
		{
			try {
				var property, result;
				for (var property in range)
				{
					if ((result = fn.call(this_object, range[property], property, range)) !== undefined) {
						throw new jam.IterationBreakException;
					}
				}

				return {completed: true};
			}
			catch (e) {
				if (!(e instanceof jam.IterationBreakException)) {
					throw e;
				}

				return {completed: false, index: property, value: result};
			}
		},

		//---------------------------------------------------------------------
		// filter (mutative), and filtered (pure)
		//---------------------------------------------------------------------
		filter: function(array, this_object, fns)
		{
			if (arguments.length == 2) {
				fns = {pred: this_object};
				this_object = undefined;
			}
			
			if (!(fns instanceof Function)) {
				fns = {pred: fns};
			}
			

			var offset = 0,
			    array_length = array.length,
			    filtered = []
			    ;

			for (var i = 0; i != array_length; ++i)
			{
				if (fns.pred.call(this_object, array[i], i, array)) {
					if (offset > 0) {
						array[i - offset] = array[i];
					}
				}
				else {
					filtered.push(array[i]);
					++offset;
				}
			}
			
			// if this IS an actual array (Array.isArray == true), then this will delete the trailing
			// properties automagically
			array.length -= offset;

			// if this is NOT an actual array, delete the trailing properties ourselves
			if (!Array.isArray(array) && offset > 0) {
				for (var i = array_length - offset; i != array_length; ++i)
					delete array[i];
			}

			if (callbacks.with_filtered !== undefined) {
				callbacks.with_filtered(filtered);
			}
		},

		filtered: function(range, this_object, pred)
		{			
			if (arguments.length == 2) {
				pred = options;
				this_object = undefined;
			}
			
			return Array.prototype.filter.call(range, pred, this_object);
		},




		//---------------------------------------------------------------------
		// transform (mutative), and map (pure)
		//---------------------------------------------------------------------
		transform: function(xs, this_object, f)
		{
			if (arguments.length == 2) {
				f = this_object;
				this_object = undefined;
			}

			jam.each(xs, this_object, function(x, i, r) {
				r[i] = f.call(this, x, i, r);
			});
		},

		map: function(xs, this_object, f)
		{
			if (arguments.length == 2) {
				f = this_object;
				this_object = undefined;
			}

			var ys = [];
			jam.each(xs, this_object, function(x, i, r) {
				ys.push(f.call(this, x, i, r));
			});
			return ys;
		},



		//---------------------------------------------------------------------
		// fold
		//---------------------------------------------------------------------
		fold: function(xs, init, fn)
		{
			jam.assert(arguments.length > 1, "jam.fold: Incorrect number of arguments");
			jam.assert(arguments.length < 4, "jam.fold: Incorrect number of arguments");
			if (!xs) return undefined;
			var i = 0, ie = xs.length;
			if (arguments.length == 2) {
				fn = init;
				init = (ie > 0) ? xs[i++] : undefined;
			}

			if (ie - i == 0)
				return init;
			
			
			for (; i != ie; ++i) {
				init = fn.call(null, init, xs[i], i);
			}
			
			return init;
		}
	};
	


	//=====================================================================
	//
	//  CURRYING
	//  ----------
	//
	//=====================================================================
	var old_underscores = [];
	
	for (var i = 0, ie = 8; i != ie; ++i) {
		old_underscores.push(window["_" + i]);
	}
	
	_this = new jam.placeholder("this");
	_  = new jam.placeholder(undefined);
	_1 = new jam.placeholder(0);
	_2 = new jam.placeholder(1);
	_3 = new jam.placeholder(2);
	_4 = new jam.placeholder(3);
	_5 = new jam.placeholder(4);
	_6 = new jam.placeholder(5);
	_7 = new jam.placeholder(6);
	_8 = new jam.placeholder(7);
	
	jam.extend(jam, {
		restore_underscore: function() {
			_ = old_underscores[0];
		},
		
		restore_placeholders: function() {
			_ = old_underscores[0];
			for (var i = 1, ie = old_underscores.length; i != ie; ++i)
			{
				if (old_underscores[i] === undefined)
					delete window["_" + i];
				else
					window["_" + i] = old_underscores[i];
			}
		},
		
		
		curry: function()
		{
			var directives = Array.prototype.slice.call(arguments),
			    fn = directives.shift(),
			    uses_undefineds = false,
			    placeholders = 0,
			    placeholder_summation = 0
			    ;
			
			jam.each(directives, function(directive) {
				if (directive instanceof jam.placeholder) {
					if (directive.value !== undefined) {
						jam.assert(!uses_undefineds,
							"jam.curry: Numbered placeholders may not follow non-numbered placeholders (i.e: _1 may not follow _)"
						);
						++placeholders;
						if (directive.value !== "this")
							placeholder_summation += directive.value;
					}
					else { 
						uses_undefineds = true;
					}
				}
			});
			
			jam.assert(placeholder_summation == placeholders * (placeholders - 1) / 2,
				"jam.curry: Incorrect sequence of placeholders"
			);
			
			return function()
			{
				var args = Array.prototype.slice.apply(arguments),
				    final_args = [],
				    placeholders = 0,
				    undefineds = 0
				    ;
				
				jam.each(directives, this, function(directive) {
					if ( directive instanceof jam.placeholder ) {
						if (directive.value === undefined) {
							final_args.push(args[placeholders + undefineds++]);
						}
						else if (directive.value === "this") {
							final_args.push(this);
						}
						else {
							final_args.push(args[directive.value]);
							++placeholders;
						}
					}
					else {
						final_args.push(directive);
					}
				});
				
				// removes (placeholders+undefineds) elements and inserts final_args at index 0 of args
				Array.prototype.splice.apply(args, [0, placeholders + undefineds].concat(final_args));
				
				return fn.apply(this, args);
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
	//  TESTING
	//  ---------
	//
	//=====================================================================
	var p = new printStackTrace.implementation();
	jam.extend(jam, {
		test: function()
		{
			var args = Array.prototype.slice.apply(arguments),
			    name = args.shift(),
			    fixtures = args[0].with_fixture ? args.shift().with_fixture() : [],
			    handler = args.with_handler || jam.test.default_handler
			    ;
			
			jam.each(args, function(x)
			{
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
					if (!(e instanceof jam.test.BadCheckException)) {
						throw e;
					}
				}
				
				p.deinstrumentFunction(jam.test, "BadCheckException");
			});
		}
	});
	
	jam.extend(jam.test, {
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
					if (Array.isArray(this._obj)) {
						if (!jam.arrays_equal(this._obj, x))
							throw new jam.test.BadCheckException;
					}
					else if (this._obj != x)
						throw new jam.test.BadCheckException;

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
	
	jam.define_members(jam.test.checker, {
		should_throw: function(fn) {
			try {
				fn();
				throw new jam.test.BadCheckException;
			}
			catch (e) {

			}
		},

		should_not_throw: function(fn) {
			try {
				fn();
			}
			catch (e) {
				throw new jam.test.BadCheckException;
			}
		}
	});
	
	




	















	//=====================================================================
	//
	//  PROXIES
	//  =========
	//
	//=====================================================================
	jam.proxies = {

		//---------------------------------------------------------------------
		// 
		//---------------------------------------------------------------------
		supported: "Proxy" in window,

		
		//---------------------------------------------------------------------
		// creates a proxy whose default action is to forward all traps to the
		// 'this' object, unsure if this is useful?
		//---------------------------------------------------------------------
		this_forwarder: function(handler, proto)
		{
			return Proxy.create(jam.extend({

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

				delete: function(name) {
					return delete this[name];
				},

				fix: function() {
					if (Object.isFrozen(this)) {
						return Object.getOwnPropertyNames(this).map(function(name) {
							return Object.getOwnPropertyDescriptor(this, name);
						});
					}
					return undefined;
				},
			 
				has: function(name) {
					return name in this;
				},

				hasOwn: function(name) {
					return Object.prototype.hasOwnProperty.call(this, name);
				},

				get: function(receiver, name) {
					return receiver[name];
				},

				set: function(receiver, name, val) {
					receiver[name] = val; return true;
				},

				enumerate: function() {
					var result = [];
					for (name in this) { result.push(name); };
					return result;
				},

				keys: function() {
					return Object.keys(this);
				}
			}, handler), proto);
		},



		forwarder: function(target, handler, proto)
		{
			return Proxy.create(jam.extend({
				getOwnPropertyDescriptor: function(name) {
					var desc = Object.getOwnPropertyDescriptor(target, name);
					if (desc !== undefined) { desc.configurable = true; }
					return desc;
				},
				getPropertyDescriptor:	function(name) {
					var desc = Object.getOwnPropertyDescriptor(target, name);
					if (desc !== undefined) { desc.configurable = true; }
					return desc;
				},
				getOwnPropertyNames: function() {
					return Object.getOwnPropertyNames(target);
				},
				getPropertyNames: function() {
					return Object.getPropertyNames(target);
				},
				defineProperty: function(name, desc) {
					Object.defineProperty(target, name, desc);
				},
				delete: function(name) { return delete target[name]; },	 
				fix: function() {
					if (Object.isFrozen(target)) {
						return Object.getOwnPropertyNames(target).map(function(name) {
							return Object.getOwnPropertyDescriptor(target, name);
						});
					}
					return undefined;
				},
			
				// derived traps
				has: function(name) { return name in target; },
				hasOwn: function(name) { return Object.prototype.hasOwnProperty.call(target, name); },
				get: function(receiver, name) { return target[name]; },
				set: function(receiver, name, val) { target[name] = val; return true; },
				enumerate: function() {
					var result = [];
					for (name in target) { result.push(name); };
					return result;
				},
				keys: function() { return Object.keys(target) }
			}, handler), proto);
		}
	};


	














	//=====================================================================
	//
	//  BaseObject
	//  ------------
	//    All Jam objects inherit from BaseObject. It gives us a few
	//    functions to ease with property construction.
	//
	//=====================================================================
	jam.BaseObject = function(){};
	jam.define_members(jam.BaseObject.prototype, {
		define_member: jam.curry(jam.define_member, _this),
		define_members: jam.curry(jam.define_members, _this),

		define_accessor: jam.curry(jam.define_accessor, _this),
		define_accessors: jam.curry(jam.define_accessors, _this)
	}, {enumerable: false});


	//=====================================================================
	//
	//
	//  PROTOTYPING
	//  =============
	//
	//
	//   
	//
	//
	//=====================================================================
	jam.extend(jam, {
		prototype: function(blueprint)
		{
			//---------------------------------------------------------------------
			// morph blueprint into something easier to use
			//---------------------------------------------------------------------
			blueprint = jam.extend({accessors:{}, methods:{}}, blueprint);
			

			//---------------------------------------------------------------------
			// superclass
			//---------------------------------------------------------------------
			var supr = (blueprint.super === undefined) ? jam.BaseObject : blueprint.super;

			
			//---------------------------------------------------------------------
			// constructor function
			//---------------------------------------------------------------------
			function jam_Object() {
				var obj = Object.create(jam_Object.prototype);

				jam_Object.prototype.__jam__.instance &&
					jam_Object.prototype.__jam__.instance.call(obj);

				jam_Object.prototype.__jam__.init && 
					jam_Object.prototype.__jam__.init.apply(obj, arguments);

				return obj;
			};



			//---------------------------------------------------------------------
			// insert jam.BaseObject into prototype chain
			//---------------------------------------------------------------------
			if (supr === jam.BaseObject || supr.prototype instanceof jam.BaseObject) {
				jam_Object.prototype = Object.create(
					supr.prototype,
					{constructor: {value: jam_Object}}
				);
			}
			else {
				jam_Object.prototype = Object.create(
					Object.create(supr.prototype, jam.BaseObject.prototype),
					{constructor: {value: jam_Object}}
				);
			}


			//---------------------------------------------------------------------
			// jam-specific prototype stuff
			//---------------------------------------------------------------------
			Object.defineProperty(jam_Object.prototype, "__jam__", {value: {
				datas: {},
				instance: function() {
					supr.prototype.__jam__ && supr.prototype.__jam__.instance
						&& supr.prototype.__jam__.instance.call(this);

					jam.each_in_object(jam_Object.prototype.__jam__.datas, this, function(v, k) {
						if (v.value === undefined)
							return;
						jam.define_member(this, k, undefined, v);
					});
				}
			}});


			//---------------------------------------------------------------------
			// accessors
			//---------------------------------------------------------------------
			jam.each_in_object(blueprint.accessors, function(v, k) {
				var regex = k.match(jam.config.accessor_regex);
				if (regex == null) {
					jam.define_accessor(jam_Object.prototype, k, v);
					return;
				}

				// not a basic accessor
				var m = {
					enumerable: regex[1].match(jam.config.is_enumerable),
					get: function() {return this[regex[3]];},
					set: regex[2] ? undefined : function(x) {return this[regex[3]] = x;}
				};

				jam.assert(regex[2] && !v.set, "jam.prototype: Accessors with a trailing question-mark can not have a set property");

				// define accessor
				jam.define_accessor(jam_Object.prototype, regex[1], jam.extend(m, v, {value: undefined}));
				// store per-instance member
				jam_Object.prototype.__jam__.datas[regex[3]] = jam.extend(v, {get: undefined, set: undefined, writable: true});
			});



			//---------------------------------------------------------------------
			// methods / static members
			//---------------------------------------------------------------------
			jam.each_in_object(blueprint.methods, function(v, k) {
				if (k.match(/^__/)) return;
				jam.define_member(jam_Object.prototype, k, v);
			});
						
			jam.define_members(jam_Object, blueprint.statics);
			


			//---------------------------------------------------------------------
			// rearrange __init__ to temporarily place a member '__super__' in our
			// instance. It's a reference to our superclass' constructor
			//---------------------------------------------------------------------
			if (blueprint.constructor) {
				jam_Object.prototype.__jam__.init = function()
				{
					if (supr.prototype.__jam__ && supr.prototype.__jam__.init)
						this.__super__ = supr.prototype.__jam__.init;

					blueprint.constructor.apply(this, arguments);

					delete this.__super__;

					if (!("Proxy" in window) && blueprint.__no_proxies__) {
						blueprint.__no_proxies__.call(this);
					}
				}
			}


			// we don't want to change the prototype from now 'till evermore
			if (Object.freeze)
				Object.freeze(jam_Object.prototype);
			
			return jam_Object;
		}
	});

	


	










	//=====================================================================
	// PROFILING
	//=====================================================================
	jam.extend(jam, {
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
	jam.extend(jam, {

		//---------------------------------------------------------------------
		// something is arraylike if it has a .length property
		//---------------------------------------------------------------------
		is_arraylike: function(range) {
			return "length" in range;
		},
		
		if_all: function(array, predicate, success, fail)
		{
			predicate = predicate || function(x) {return x;};

			if (array === undefined) {
				fail && fail(array);
				return false;
			}
			else if (jam.is_arraylike(array)) {
				for (var i = 0, ie = array.length; i != ie; ++i) {
					if ( !predicate(array[i]) ) {
						fail && fail(array);
						return false;
					}
				}
			}
			else {
				for (var p in array) {
					if ( !predicate(array[p]) ) {
						fail && fail(array);
						return false;
					}
				}
			}

			success && success(array);
			return true;
		},
		
		if_any: function(array, predicate, success, fail) {
			if (array === undefined) {
				fail && fail(array);
				return false;
			}

			return !jam.if_all(array, function(x) {
				return !predicate(x);
			}, fail, success);
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
			
			jam.each(lhs, function(i, x) {
				if (rhs[i] === undefined) { return false; }
				result.push([x, rhs[i]]);
			});

			return result;
		},


		


		arrays_equal: function(lhs, rhs) {
			var temp = [];
			
			// make sure lengths are same
			if (lhs.length != rhs.length ) {
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
					if (Array.isArray(lhse) && Array.isArray(rhse)) {
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
		// linear_search
		// ---------------
		//   searches an unsored range for an element that satisfies @pred
		//=====================================================================
		linear_search: function(unsorted_range, pred, opt_bounds) {
			opt_bounds = pred instanceof Function ? (opt_bounds || [0, unsorted_range.length]) : pred;
			pred = pred instanceof Function ? pred : jam.default_predicate;
			
			for (var i = opt_bounds[0]; i != opt_bounds[1]; ++i) {
				if (pred(unsorted_range[i])) {
					return {found: true, index: i};
				}
			}

			return {found: false, index: unsorted_range.length};
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
	
})();



//=====================================================================
//
//  test suite
//
//=====================================================================
(function(undefined) {
	
	//=====================================================================
	// currying
	//=====================================================================
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
		}},

		{should: "correct curry the 'this' argument", ie: function() {
			function add_mx_y(m, y) {return m.x + y}

			var o = {
				x: 4,
				add: jam.curry(add_mx_y, _this)
			};
			
			this(o.add(3))
				.should_equal(7);
		}}
	);

	
	//=====================================================================
	// each
	//=====================================================================
	jam.test("jam.each()",
		{with_fixture: function() {
			return [[1, 2, 3, 4, 5]];
		}},

		{should: "nop and return undefined for bad input", ie: function() {
			this(jam.each(undefined)).should_equal(undefined);
			this(jam.each(null)).should_equal(undefined);
		}},

		{should: "pass the correct element per call", ie: function(a) {
			var result = [];
			jam.each(a, function(x, i) { result.push(x); });
			this(result).should_equal_array(1, 2, 3, 4, 5);
		}},

		{should: "pass the correct index per call", ie: function(a) {
			var indexes = [];
			jam.each(a, function(x, i) { indexes.push(i); });
			this(indexes).should_equal_array(0, 1, 2, 3, 4);
		}},

		{should: "pass the correct array per call", ie: function(a) {
			var self = this;
			jam.each(a, function(x, i, r) { self(r).should_equal(a); });
		}},

		{should: "pass a this-object if provided", ie: function(a) {
			var self = this;
			jam.each(a, this, function() {self(this).should_equal(self);});
		}},

		{should: "continue when undefined is returned", ie: function(a) {
			var result = 0;
			jam.each(a, function(x) {
				if (x == 3) return;
				result += x;
			});
			this(result).should_equal(12);
		}},

		{should: "return value when a non-undefined value is returned", ie: function(a) {
			this(
				jam.each(a, function(x) {
					if (x == 3) return "dragon";
				})
			).should_equal("dragon");
		}},

		{should: "work appropriately given a callback structure", ie: function(a) {
			var result = 0;
			jam.each(a, {apply: function(x) {result += x;}});
			this(result).should_equal(15);
		}},

		{should: "call 'broke' correctly if an early return is found", ie: function(a) {
			var self = this, result = 0, did_break = false;
			var each_result = jam.each(a, {
				apply: function(x) {
					if (x == 3)
						return "dragon";
					result += x;
				},

				broke: function(v, x, i, r) {
					self([v, x, i, r]).should_equal_array("dragon", 3, 2, a);
					did_break = true;
				}
			});
			this(did_break).should_equal(true);
		}}
	);

	//=====================================================================
	// fold
	//=====================================================================
	jam.test("jam.fold()",
		{with_fixture: function() {
			return [[1, 2, 3, 4, 5], function(lhs,rhs){return lhs+rhs;}];
		}},

		{should: "reject function calls with incorrect arguments", ie: function() {
			this.should_throw(function() { jam.fold(); });
			this.should_throw(function() { jam.fold([]); });
			this.should_throw(function() { jam.fold([], null, jam.each, "superfluous"); });
		}},

		{should: "return undefined when given bad input", ie: function(_, add) {
			this(jam.fold(undefined, add)).should_equal(undefined);
			this(jam.fold(null, add)).should_equal(undefined);
		}},

		{should: "return single item when given array of one item", ie: function() {
			this(jam.fold([1], jam.each)).should_equal(1);
		}},

		{should: "fold a one-element array and an initial value", ie: function(a, add) {
			this(jam.fold([1], 2, add)).should_equal(3);
		}},

		{should: "fold without an initial value", ie: function(a, add) {
			this(jam.fold(a, add)).should_equal(15);
		}},

		{should: "fold with an initial value", ie: function(a, add) {
			this(jam.fold(a, 10, add)).should_equal(25);
		}}
	);


	//=====================================================================
	// binary search
	//=====================================================================
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



