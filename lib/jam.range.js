//=====================================================================

//=====================================================================
(function(undefined) {
	
	//=====================================================================
	//
	//
	//
	//
	//=====================================================================
	jam.Range = jam.prototype({

		methods: {
			_applicator: function(fn, x) {
				fn.call(x, x);
			},
			
			each: function(fn) {
				while ( !this.empty ) {
					this._applicator(fn, this.head);
					this.pop_head();
				}
			},

			mapped: function(fn) {
				return jam.MapRange(this, fn);
			},
		},
		
		statics: {
			is_forward: function(range) {
				return "head" in range && "tail" in range && "pop_head" in range;
			},
			
			is_random_access: function(range) {
				var good = jam.Range.is_forward(range);
				good = good && "length" in range;
				good = good && (range.length === 0 || range[0] !== undefined);
				return good;
			},
			
			is_finite: function(range) {
				return range.empty !== "never";
			},
			
			random_accessorise: function(obj, ops)
			{
				// a random-access range does not necessarily mean it has a determinable length
				if (ops.length) {
					Object.defineProperty(obj, "_length", {value: null});
					Object.defineProperty(obj, "length", {enumerable: true,
						get: function() {
							return obj._length !== null ? obj._length : (obj._length = ops.length.call(obj));
						}
					});
				}
				
				// but it does necessitate indices
				Object.defineProperty(obj, "_indices", {value: {}});
				
				for (var i = ops.from; i != ops.until; ++i) {
					(function(i, j) {
						Object.defineProperty(obj, j, {enumerable: true,
							get: function() {
								if (obj._indices[i] !== undefined)
									return obj._indices[i];
								else
									return obj._indices[i] = ops.index.call(obj, i);
							}
						});
					})(i, i - (ops.diff || 0));
				}
				
				// used for determining if it's a RAR
				obj.at = function(i) {
					return this[i];
				};
			}
		}
	});


	//=====================================================================
	//=====================================================================
	jam.ArrayRange = jam.prototype({
		super: jam.Range,
		
		init: function(array, from, until) {
			jam.assert(array, "Array is not right!");
			
			from = from || 0;
			until = until || array.length;

			this._define_members({
				_array: array,
				_from: from,
				_until: until,
				_current: from
			});
		},

		accessors: {
			head: function() {
				return this.empty ? undefined : this._array[this._current];
			},
			
			tail: function() {
				return this.empty ? undefined : jam.ArrayRange(this._array, this._current + 1, this._until);
			},
			
			empty: function() {
				return this._current == this._until;
			},

			length: function() {
				return this._until - this._current;
			}
		},
		
		methods: {
			at: function(i) {
				jam.assert(i >= 0 && i < (this.length - this._current), "jam.ArrayRange.at: bad index (" + i + ")");
				return this._array[this._current + i];
			},

			pop_head: function() {
				++this._current;
				if (!jam.proxies.supported)
					delete this[this.length];

				return this;
			},
			
			clone: function() {
				return jam.ArrayRange(this._array, this._current, this._until);
			},

			__missing__: function(name) {
				if (name.match(/\d+/))
					return this.at(+name);
			}
		},

		__no_proxies__: function() {
			var self = this;
			for (var i = 0, ie = this.length; i != ie; ++i) {
				(function(i){
					self._define_accessor(i, function() {
						return self.at(i);
					});
				})(i);
			}
		}
	});



	//=====================================================================
	//
	//
	//
	//=====================================================================
	jam.MapRange = jam.prototype({

		super: jam.Range,

		init: function(range, fn)
		{
			this._define_members({
				_range: range,
				_fn: fn,
				_is_random_access: jam.Range.is_random_access(range),
				_cached_values: {},
				_index_offset: 0
			});

			// if the given range is random-access, so are we!
			if (this._is_random_access)
			{
				this._define_member("at", function(i) {
					return this[i];
				});

				this._define_accessor("length", function() {
					return this._range.length;
				});
			}
		},


		accessors: {
			head: function() {
				return this.empty ? null : this._fn.call(this._range.head, this._range.head);
			},

			tail: function() {
				return this.empty ? null : jam.MapRange(this._range.clone().pop_head(), this._fn);
			},

			empty: function() {
				return this._range.empty;
			}
		},


		methods: {
			pop_head: function() {
				this._range.pop_head();
				if (this._cached_values[this._index_offset])
					delete this._cached_values[this._index_offset];
				++this._index_offset;
				return this;
			},
			
			clone: function() {
				return jam.MapRange(this._range.clone(), this._fn);
			},

			// MapRange is only a random-access range if its underlying range is.
			// __method_missing__ is only used for the index operator.
			__missing__: function(i)
			{
				if (!this._is_random_access)
					return undefined;
				
				// make sure valid index
				i = +i;
				if (isNaN(i) || i < 0 || i >= this._range.length)
					return undefined;
				
				// cache the computed value
				var index = this._index_offset + i;
				if (this._cached_values[index] === undefined) {
					this._cached_values[index]
						= this._fn.call(this._range[i], this._range[i]);
				}

				return this._cached_values[index];
			}
		}


	});

	//=====================================================================
	//=====================================================================
	jam.ZipRange = jam.prototype({

		super: jam.Range,
		
		init: function()
		{
			var args = Array.prototype.slice.call(arguments),
			    finite = true,
			    randomly_accessable = true
			    ;
			
			jam.each(args, function(x) {
				if (!jam.Range.is_finite(x))
					finite = false;
				if (!jam.Range.is_random_access(x))
					randomly_accessable = false;

				if (!finite && ! randomly_accessable)
					return false;
			});

			this._define_members({
				_ranges: args,
				_is_random_access: jam.if_all(args, function(x) {
					return jam.Range.is_random_access(x);
				})
			});
		},

		accessors: {
			head: function() {
				return jam.map(this._ranges, function(x) {
					return x.head;
				});
			},

			tail: function() {
				return jam.ZipRange.apply(jam, 
					jam.map(this._ranges, function(x) {
						return x.clone().pop_head();
					})
				);
			},

			empty: function() {
				return jam.if_any(this._ranges, function(x) {
					return x.empty;
				});
			}
		},

		methods: {
			_applicator: function(fn, x) {
				fn.apply(x, x);
			},
			
			pop_head: function()
			{
				if (this.empty) return this;
				jam.each(this._ranges, function(x) {
					x.pop_head();
				});
				return this;
			},
			
			clone: function() {
				return jam.ZipRange.apply(this, jam.map(this._ranges, function(x) {return x.clone();}));
			},

			__missing__: function(i) {
				if (!this._is_random_access)
					return undefined;
				
				// make sure valid index
				i = +i;
				if (isNaN(i) || i < 0 || i >= this.length)
					return undefined;
				
				// cache the computed value
				var index = this._index_offset + i;
				if (this._cached_values[index] === undefined) {
					this._cached_values[index]
						= this._fn.call(this._range[i], this._range[i]);
				}

				return this._cached_values[index];
			}
		}
	});
	

	//=====================================================================
	//
	//
	//
	//=====================================================================

/*



	//=====================================================================
	//=====================================================================
	jam.FilterRange = jam.prototype({

	supers: [
		jam.Range
	],
	
	datas: {
		_range: null,
		_predicate: null
	},

	protics: {
		__init__: function(range, predicate)
		{
			this._range = range;
			this._predicate = predicate;
		},
		
		_headed: function() {
			while (!this._range.empty && !this._predicate.call(this._range.head, this._range.head)) {
				this._range.pop_head();
			}
			
			return this._range.head;
		},
		
		_tailed: function() {
			return this._range.empty ? null : jam.FilterRange(this._range.clone().pop_head(), this._predicate);
		},
		
		_emptied: function() {
			return this._range.empty;
		},
		
		pop_head: function()
		{
			while (!this._range.empty) {
				this._range.pop_head();
				if (!this._predicate.call(this._range.head, this._range.head)) break;
			}
			
			this._head = this._tail = null;
			return this;
		},
		
		clone: function() {
			return jam.FilterRange(this._range.clone(), this._predicate);
		}
	}});
	
	
	
	
	
	
	

	
	
	//=====================================================================
	//=====================================================================
	jam.IntegerRange = jam.prototype({

	supers: [
		jam.Range
	],
	
	datas: {
		_index: 0,
		_empty: "never"
	},

	protics: {
		__init__: function(starting_index)
		{
			this._index = starting_index || 0;
		},
		
		_headed: function() {
			return this._index;
		},
		
		_tailed: function() {
			return jam.IntegerRange(this._index + 1);
		},
		
		pop_head: function()
		{
			++this._index;
			return this;
		},
		
		clone: function() {
			return jam.IntegerRange(this._index);
		},
		
		at: function(x) {
			return x;
		}
	}});



	
	
	
	
	
	
	//=====================================================================
	//=====================================================================
	jam.TakeRange = jam.prototype({
	
	supers: [
		jam.Range
	],
	
	datas: {
		_range: null,
		_i: 0,
		_n: 0
	},
	
	protics: {
		__init__: function(range, n, length)
		{
			this._range = range;
			this._n = n;
			this._length = length;
			
			if ( jam.Range.is_random_access(range) )
			{
				this._n = n < this._range.length ? n : this.range.length;
				jam.Range.random_accessorise(this, {
					from: 0,
					until: this._n,
					diff: this._from,
					
					length: function() {
						return this._n;
					},
					
					index: function(i) {
						return this._range[i];
					}
				});
			}
		},
		
		_headed: function() {
			return this.empty ? undefined : this._array[this._from];
		},
		
		_tailed: function() {
			return this.empty ? undefined : jam.ArrayRange(this._array, this._from + 1, this._until);
		},
		
		_emptied: function() {
			return this._i === this._n;
		},
		
		pop_head: function() {
			jam.assert(!this.empty);
			++this._i;
			this._range.pop_head();
			this._head = this._tail = this._empty = null;
			return this;
		},
		
		clone: function() {
			return jam.TakeRange(this._range, this._n - this._i);
		}
		
	}});
	
	*/
	
})();


