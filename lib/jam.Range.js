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
		_infinite: false
	},
	
	protics: {
		__init__: function()
		{
			//---------------------------------------------------------------------
			// sometimes we want to defer calculation of head and tail even later,
			// and thus allow child ranges to 
			//---------------------------------------------------------------------
			Object.defineProperty(this, "head", {enumerable: true, configurable: false,
				get: function() {
					if (this._head !== null)
						return this._head;
					else {
						return this._head = this._headed();
					}
				}
			});
			
			Object.defineProperty(this, "tail", {enumerable: true, configurable: false,
				get: function() {
					if (this._tail !== null)
						return this._tail;
					else {
						return this._tail = this._tailed();
					}
				}
			});
			
			
			//---------------------------------------------------------------------
			// empty is very straightforward
			//---------------------------------------------------------------------
			Object.defineProperty(this, "empty", {enumerable: true, configurable: false, 
				get: function() {
					return this._infinite || (this._emptied ? this._emptied() : this._head === null);
				}
			});
		},
		
		
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
		adapt: function(range, _1, _2) {
			if (jam.is_iterable(range))
				return jam.Range.ArrayAdapter(range, _1, _2);
			else
				return range;
		}
	}});
	
	
	//=====================================================================
	//=====================================================================
	jam.Range.ArrayAdapter = jam.ArrayRange = jam.prototype({
	
	supers: [
		jam.Range
	],
	
	protics: {
		__init__: function(array, from, until) {
			this._array = array;
			this._from = from || 0;
			this._until = until || array.length;
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
	


	//=====================================================================
	//=====================================================================
	jam.FilterRange = jam.prototype({

	supers: [
		jam.Range
	],

	protics: {
		__init__: function(range, predicate, inc)
		{
			this._range = jam.Range.adapt(range);
			this._predicate = predicate;

			if (inc && !this._range.empty)
				this._range.pop_head();
		},
		
		_headed: function() {
			while (!this._range.empty && !this._predicate.call(this._range.head)) {
				this._range.pop_head();
			}
			
			return this._range.head;
		},
		
		_tailed: function() {
			return this._range.empty ? null : jam.FilterRange(this._range, this._predicate);
		},
		
		_emptied: function() {
			return this._range.empty;
		},
		
		pop_head: function()
		{
			do {
				this._range.pop_head();
			} while (!this._range.empty && !this._predicate.call(this._range.head));
			
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

	protics: {
		__init__: function(lhs, rhs)
		{
			this._lhs = jam.Range.adapt(lhs);
			this._rhs = jam.Range.adapt(rhs);
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

	protics: {
		__init__: function(range, fn)
		{
			this._range = jam.Range.adapt(range);
			this._fn = fn;
		},
		
		_headed: function() {
			return this.empty ? null : this._fn.call(this._range.head);
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
	
})();


	

var A = jam.Array([1, 2, 3, 4, 5]);

var AR = jam.ArrayRange(A, 1, 5);
// AR.each(function(x) {
// 	console.log(x);
// });

var RFR = jam.MapRange(A, function() {
	return this * 2;
});

RFR.each(function(x) {
	console.log(x);
});

console.dir(AR);



