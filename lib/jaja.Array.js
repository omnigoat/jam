

//=====================================================================
// 
//=====================================================================
(function(undefined) {
	$.extend(jam, {
		Sequence: {
			init: function() {
				for (var x in ["each", "filter", "fold"]) {
					this[x] = jam[x].partial.call(this);
				}
			}
		}
	});
})();

jam.inherit = function() {
	var args = Array.prototype.slice.call(arguments),
	    inheritor = args.shift()
	    ;
	
	for (var x in args) {
		$.extend(inheritor, x);
		if (x.init !== undefined) {
			x.init.call(inheritor);
		}
	}
};


// jam.define_class()
// .inheriting(Range, Sequence)
// .as({
//      
// })

jam.define_class = function() {
	var _this = {};

	function _inheritor() {
		var args = Array.prototype.slice.call(arguments),
		    inheritor = args.shift()
		    ;
		
		for (var x in args) {
			$.extend(inheritor, x);
			if (x.init !== undefined) {
				x.init.call(inheritor);
			}
		}
	}

	function _as(properties) {
		for (var x in properties) {
			this[x] = properties[x];
		}
	}

	return {
		inheriting: function() {
			_inheritor.apply(_this, arguments);
			return {
				as: function() {_as.apply(_this, arguments)}
			};
		},

		as: function() {
			_as.apply(_this, arguments);
		}
	};
}



//=====================================================================
//
//  Range
//
//=====================================================================
(function(undefined) {
	function jaja_Range() {
		return {};
	}

	jaja.Range = function() {
		Range: function() {
			if (this.constructor == jaja.Array) {
				return this;
			}

			return jaja.Range.init.apply(new jaja.Range(), arguments);
		}
	};

	$.extend(jaja.Range, {
		init: function(data, begin, end) {
			$.extend(this, jaja.Indexable, jaja.Range);

			this.__proto__.constructor = jaja.Array;
			this._data = data;
			this._begin = begin;
			this._end = end;
		},

		each: function(options, fn) {
			if (options instanceof Function) {
				fn = options;
				options = this._default_options();
			}
			else {
				options = this._optionise(options);
			}

			options.from += this._begin;
			options.until = options.from + this._end;

			for (var i = options.from; i != options.until; ++i) {
				fn( this._data[i] );
			}

			return this;
		}
	});
})();




(function(undefined) {
	jaja.Array = function()
	{
		if (this.constructor == jaja.Array) {
			return this;
		}

		return jaja.Array.init.apply(new jaja.Array(), arguments);
	};
	

	$.extend(jaja.Array, {
		init: function(init_list)
		{
			$.extend(this, jaja.Sequence, jaja.Array);

			this.length = 0;
			if (init_list !== undefined) {
				if (Array.isArray(init_list))
					this.insert(0, init_list);
				else
					this.insert(0, arguments);
			}
			
			return this;
		},

		//=====================================================================
		// fall-throughs
		//=====================================================================
		push_back: function() {
			Array.prototype.push.apply(this, arguments);
			return this;
		},

		pop_back: function() {
			return Array.prototype.pop.apply(this, arguments);
		},

		push_front: function() {
			Array.prototype.unshift.apply(this, arguments);
			return this;
		},

		pop_front: function() {
			return Array.prototype.shift.apply(this, arguments);
		},

		slice: function(begin, end) {
			begin = this._reindex(begin);
			end = this._reindex(end);
			return Array.prototype.slice.call(this, begin, end);
		},

		splice: function() {
			console.error("jaja.Array.splice is only defined for introspection");
		},


		//=====================================================================
		// swap
		//=====================================================================
		swap: function(lhs, rhs) {
			lhs = this._reindex(lhs);
			rhs = this._reindex(rhs);
			var t = this[lhs];
			this[lhs] = this[rhs];
			this[rhs] = t;
			return this;
		},

		
		//=====================================================================
		// append/prepend/insert
		//=====================================================================
		append: function() {
			for (var i = 0, ie = arguments.length; i != ie; ++i) {
				this.insert(this.length, arguments[i]);
			}
			return this;
		},

		prepend: function() {
			for (var i = 0, ie = arguments.length; i != ie; ++i) {
				this.insert(0, arguments[i]);
			}
			return this;
		},

		


		//=====================================================================
		// remove
		//=====================================================================
		remove: function(options)
		{
			if (options instanceof Object) {
				options = this._optionise(options, true);
			}
			// allow for a single number as the first parameter
			else {
				options = {
					from: options,
					to: options + 1,
					step: 1
				}
			}

			var result = jaja.Array()
			    ;

			// even faster if the step is 1
			if (options.step === 1) {
				return jaja.Array( Array.prototype.splice.call(this, options.from, options.until) );			
			}
		
			var offset = 0,
			    i = options.from,
			    s = options.from
			    ;
			
			for ( ; i != options.until; ++i )
			{
				if (i === s) {
					s += options.step;
					options.reverse ? result.push_front(this[i]) : result.push_back(this[i]);
					++offset;
					--this.length;
					continue;
				}

				if (offset > 0) {
					this[i - offset] = this[i];
				}
			}

			// if we *did* remove elements, reposition trailing elements
			if (offset > 0) {
				for (var ie = this.length + offset; i != ie; ++i) {
					this[i - offset] = this[i];
					delete this[i];
				}
			}

			return result;
		},


		//=====================================================================
		// has_subset (inputs should be sorted)
		//=====================================================================
		has_subset: function(rhs, pred)
		{
			pred = pred || jaja.default_predicate;
			for (var i = 0, ie = rhs.length, j = 0, je = this.length, result = undefined; i != ie; ++i, ++j) {
				while (j != je && (result = pred(rhs[i], this[j])) > 0)
					++j;
				if (result !== 0) {
					return false;
				}
			}
			return true;
		},


		


		//=====================================================================
		// fold
		//=====================================================================
		// probably should do this at some point


		//=====================================================================
		// map (mutative), and mapped (pure)
		//=====================================================================
		map: function(options, fn)
		{
			if (fn === undefined) {
				fn = options;
				options = this._default_options();
			}
			else {
				options = this._optionise(options);
			}

			for (var i = options.from, ie = options.until; i != ie; i += options.step)
				this[i] = fn(this[i]);
			return this;
		},

		mapped: function(options, fn)
		{
			if (fn === undefined) {
				if (Array.prototype.map !== undefined) {
					return Array.prototype.map.call(this, options);
				}
				fn = options;
				options = this._default_options();
			}
			else {
				options = this._optionise(options);
			}

			var result = jaja.Array();
			for (var i = options.from, ie = options.until; i != ie; i += options.step)
				result.push_back( fn.apply(callback_object, [this[i]]) );
			return result;
		},



		//=====================================================================
		// filter (mutative), and filtered(pure)
		//=====================================================================
		// filter: function(options, pred, callback_this)
		filter: function(pred, callback_object)
		{
			if (this.length == 0)
				return this;
			
			// filter elements, moving them "up" in the array steadily.
			// this algorithm maintiains .length correctly between calls.
			var offset = 0;
			callback_this = callback_this || this;
			for (var i = 0, ie = this.length; i != ie; ++i) {
				if (pred.call(callback_this, this[i])) {
					if (offset > 0) {
						this[i - offset] = this[i];
					}
				}
				else {
					++offset;
					--this.length;
				}
			}

			// delete unused elements at the end
			for (var i = this.length, ie = this.length + offset; i != ie; ++i) {
				delete this[i];
			}

			return this;
		},


		filtered: function(pred, callback_object)
		{
			callback_object = callback_object || this;
			if (Array.prototype.filter !== undefined) {
				return Array.prototype.filter.apply(callback_object, [pred]);
			}

			var result = jaja.Array();
			this.each(function(x) {
				if (pred.apply(callback_object, [x]))
					result.push_back(x);
			});

			return result;
		},


		//=====================================================================
		// reverses
		//=====================================================================
		reverse: function(from, to)
		{
			if (arguments.length !== 0 && arguments.length !== 2) {
				console.error("incorrect arguments to jaja.Array.reverse");
			}

			from = from || 0;
			to = to || this.length;
			while (from < to)
			{
				// don't use this.swap because it will be slower
				var t = this[from];
				this[from] = this[to];
				this[to] = t;
			}
		},



		//=====================================================================
		// sort
		//=====================================================================
		sort: function(pred) {
			Array.prototype.sort.call(this, pred || jaja.default_predicate);
		},

		//=====================================================================
		// stable_sort
		//=====================================================================
		stable_sort: function(options, pred)
		{
			if (pred === undefined) {
				pred = options;
				options = this._default_options();
			}
			else {
				options = this._optionise(options);
			}

			if (options.until - options.from < 12) {
				this._insert_sort(options.from, options.until, pred);
				return;
			}

			var middle = (options.from + options.until) / 2;
			this.stable_sort(options.from, middle);
			this.stable_sort(middle, options.until);
			this._merge(options.from, middle, options.until, middle - options.from, options.until - middle, pred);
			return this;
		},
















		_rotate: function(from, mid, to)
		{
			if (from == mid || mid == to) return;
			var n = this._gcd(to - from, mid - from);
			while (n-- !== 0)
			{
				var val = this[from + n],
				    shift = mid - from,
				    p1 = from + n,
				    p2 = from + n + shift
				    ;
				
				while (p2 != from + n) {
					this[p1] = this[p2];
					p1 = p2;
					if (to - p2 > shift)
						p2 += shift;
					else
						p2 = from + shift - to + p2;
				}

				this[p1] = val;
			}
		},

		_gcd: function(m, n) {
			while (n != 0) {
				var t = m % n;
				m = n;
				n = t;
			}
			return m;
		},

		_lower: function(from, to, v, pred)
		{
			var length = to - from;
			while (length > 0) {
				var half = Math.floor(length / 2),
				    mid = from + half;
				if ( pred(this[mid], this[v]) < 0 ) {
					from = mid + 1;
					length = length - half - 1;
				}
				else {
					length = half;
				}
			}
			return from;
		},

		_upper: function(from, to, v, pred)
		{
			var length = to - from;
			while (length > 0) {
				var half = Math.floor(length / 2),
				    mid = from + half;
				if ( pred(this[v], this[mid]) < 0 ) {
					length = half;
				}
				else {
					from = mid + 1;
					length = length - half - 1;
				}
			}
			return from;
		},

		_insert_sort: function(from, to, pred)
		{
			if (to <= from + 1) return;

			for (var i = from + 1; i < to; ++i) {
				for (var j = i; j > from; --j) {
					if ( pred(this[j], this[j - 1]) < 0 ) {
						this.swap(j, j - 1);
					}
					else {
						break;
					}
				}
			}
		},



		_merge: function(from, pivot, to, length1, length2, pred)
		{
			if (length1 == 0 || length2 == 0)
				return;
			if (length1 + length2 == 2) {
				if (pred(this[pivot], this[from]) < 0)
					this.swap(pivot, from);
				return;
			}
			var first_cut, second_cut, length11, length22;
			if (length1 > length2) {
				length11 = Math.floor(length1 / 2);
				first_cut = from + length11;
				second_cut = this._lower(pivot, to, first_cut, pred);
				length22 = second_cut - pivot;
			}
			else {
				length22 = Math.floor(length2 / 2);
				second_cut = pivot + length22;
				first_cut = this._upper(from, pivot, second_cut, pred);
				length11 = first_cut - from;
			}

			this._rotate(first_cut, pivot, second_cut);
			var new_mid = first_cut + length22;
			this._merge(from, first_cut, new_mid, length11, length22, pred); 
			this._merge(new_mid, second_cut, to, length1 - length11, length2 - length22, pred);
		},




	});

})();






