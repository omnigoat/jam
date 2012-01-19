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
		_is_range: true,
		_head: null,
		_tail: null,
		_empty: null
	},
	
	accers: {
		head: function() {
			if (this._head !== null)
				return this._head;
			else
				return this._head = this._headed();
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
		_lhs: null,
		_rhs: null
	},
	
	protics: {
		__init__: function(lhs, rhs)
		{
			this._lhs = lhs;
			this._rhs = rhs;
		},
		
		_headed: function() {
			return this.empty ? null : [this._lhs.head, this._rhs.head];
		},
		
		_tailed: function() {
			return this.empty ? null : jam.ZipRange(this._lhs.clone().pop_head(), this._rhs.clone().pop_head());
		},
		
		_emptied: function() {
			return this._lhs.empty || this._rhs.empty;
		},
		
		_applicator: function(fn, x) {
			fn.call({key: x[0], value: x[1]}, x[0], x[1]);
		},
		
		pop_head: function()
		{
			if (this.empty) return this;
			this._lhs.pop_head();
			this._rhs.pop_head();
			this._head = this._tail = null;
			return this;
		},
		
		clone: function() {
			return jam.ZipRange(this._lhs.clone(), this._rhs.clone());
		}
	}});
	
	

	//=====================================================================
	//=====================================================================
	jam.MapRange = jam.prototype({

	supers: [
		jam.Range
	],
	
	ultras: function(range) {
		return jam.Range.is_random_access(range) ? [jam.RandomAccessRange] : null;
	},
	
	datas: {
		_range: null,
		_fn: null
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
			this._head = this._tail = null;
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
		_infinite: true
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
			return this._from === this._until;
		},
		
		pop_head: function() {
			++this._from;
			this._head = this._tail = null;
			return this;
		},
		
		clone: function() {
			return jam.ArrayRange(this._array, this._from, this._until);
		}
		
	}});
})();

var a = [1, 2, 3, 4, 5];
var ar = jam.ArrayRange(a);
console.log(ar[2], "out of", ar.length);
var mr = jam.MapRange(ar, function(x) {
	return x * 2;
});
console.log(mr[2]);
console.dir(mr);




