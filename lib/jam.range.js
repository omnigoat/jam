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
	
	datas: {
		_head: null,
		_tail: null,
		_empty: null,
		_no_defer: false
	},
	
	accers: {
		head: function() {
			if (this._no_defer) return this._headed();
			if (this._head === null) this._head = this._headed();
			if (this._head === undefined) return null;
			return this._head;
		},
		
		tail: function() {
			if (this._tail !== null)
				return this._tail;
			else
				return this._tail = this._tailed();
		},
		
		empty: function() {
			if (this._empty !== null)
				return this._empty;
			else
				return this._empty = (this._emptied ? this._emptied() : this._head === null)
		}
	},
	
	protics: {
		//---------------------------------------------------------------------
		// we provide defaults for these
		//---------------------------------------------------------------------
		_headed: function() {
			return null;
		},
		
		_tailed: function() {
			return null;
		},
		
		_applicator: function(fn, x) {
			fn.call(x, x);
		},
		
		pop_head: function() {
			throw "not yet implemented";
		},
		
		clone: function() {
			throw "not yet implemented";
		},
		
		each: function(fn) {
			while ( !this.empty ) {
				this._applicator(fn, this.head);
				this.pop_head();
			}
		}
	},
	
	statics: {
		is_forward: function(range) {
			var P = Object.getPrototypeOf(range);
			var good_keys = P.hasOwnProperty("head") && P.hasOwnProperty("tail") && range.pop_head !== undefined;
			return good_keys;
		},
		
		is_random_access: function(range) {
			return jam.Range.is_forward(range) && range.at !== undefined;
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
	}});


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
	jam.ZipRange = jam.prototype({

	supers: [
		jam.Range
	],
	
	datas: {
		_ranges: null		
	},
	
	protics: {
		__init__: function()
		{
			this._ranges = Array.prototype.slice.call(arguments);
		},
		
		_headed: function() {
			return jam.map(this._ranges, function(x) {
				return x.head;
			});
		},
		
		_tailed: function() {
			return jam.ZipRange.apply(jam, 
				jam.map(this._ranges, function(x) {
					return x.clone().pop_head();
				})
			);
		},
		
		_emptied: function() {
			return !jam.if_all(this._ranges, function(x) {
				return !x.empty;
			});
		},
		
		_applicator: function(fn, x) {
			fn.apply(x, x);
		},
		
		pop_head: function()
		{
			if (this.empty) return this;
			jam.each(this._ranges, function(x) {
				x.pop_head();
			});
			this._head = this._tail = this._empty = null;
			return this;
		},
		
		clone: function() {
			return jam.ZipRange.apply(this, jam.map(this._ranges, function(x) {return x.clone();}));
		}
	}});
	
	

	//=====================================================================
	//=====================================================================
	jam.MapRange = jam.prototype({

	supers: [
		jam.Range
	],
	
	datas: {
		_range: null,
		_fn: null
	},
	
	proxy_handler: {
		get: function(name, args) {
			
		}
	},

	protics: {
		__init__: function(range, fn)
		{
			this._range = range;
			this._fn = fn;
			
			// if the given range is random-access, so are we!
			if (jam.Range.is_random_access(this._range))
			{
				jam.Range.random_accessorise(this, {
					from: 0,
					until: this._range.length,
					length: function() {
						return this._range.length;
					},
					index: function(i) {
						return this._fn.call(this._range[i], this._range[i]);
					}
				});
			}
		},
		
		_headed: function() {
			return this.empty ? null : this._fn.call(this._range.head, this._range.head);
		},
		
		_tailed: function() {
			return this.empty ? null : jam.MapRange(this._range.clone().pop_head(), this._fn);
		},
		
		_emptied: function() {
			return this._range.empty;
		},
		
		pop_head: function()
		{
			this._range.pop_head();
			this._head = this._tail = this._empty = null;
			return this;
		},
		
		clone: function() {
			return jam.MapRange(this._range.clone(), this._fn);
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
	jam.ArrayRange = jam.prototype({
	
	supers: [
		jam.Range
	],
	
	datas: {
		_array: null,
		_from: 0,
		_until: 0
	},
	
	protics: {
		__init__: function(array, from, until)
		{
			jam.assert(array, "Array is not right!");
			
			this._array = array ? array.concat() : null;
			this._from = from || 0;
			this._until = until || array.length;
			
			jam.Range.random_accessorise(this, {
				from: this._from,
				until: this._until,
				diff: this._from,
				
				length: function() {
					return this._until - this._from;
				},
				
				index: function(i) {
					return this._array[i];
				}
			});
		},
		
		_headed: function() {
			return this.empty ? null : this._array[this._from];
		},
		
		_tailed: function() {
			return this.empty ? null : jam.ArrayRange(this._array, this._from + 1, this._until);
		},
		
		_emptied: function() {
			return this._from >= this._until;
		},
		
		pop_head: function() {
			++this._from;
			this._head = this._tail = this._empty = null;
			return this;
		},
		
		clone: function() {
			return jam.ArrayRange(this._array, this._from, this._until);
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
	
	
	
})();





function add() {
	var args = Array.prototype.slice.call(arguments);
	var result = 0;
	for (var i = 0, ie = args.length; i != ie; ++i) {
		result += args[i];
	}
	return result;
}

var add2 = jam.curry(add, 2);

console.log( add2(4) );


