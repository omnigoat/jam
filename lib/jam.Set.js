
//=====================================================================
// 
//=====================================================================
(function(undefined) {

	jam.Set = jam.prototype({
	supers: [
		jam.Sequence
	],
	
	statics: {
		default_predicate: function(lhs, rhs) {
			return lhs < rhs;
		}
	},

	protics: {	
		__init__: function(predicate)
		{
			this.length = 0;
			this._predicate = predicate || jam.Set.default_predicate;
			
			return this;
		},

		add: function(element)
		{
			var r = jam.binary_search_for(this, element, this._predicate);
			if (r.found) {
				return false;
			}
			
			this.insert(r.index, [element]);
			return true;
		},

		add_all: function(elements)
		{
			var set = this;
			jam.each(elements, function(x) {
				set.add(x);
			});
		},

		//=====================================================================
		// upper_bound
		// -------------
		//   Returns the index pointing to the first element in the set that
		//   is "greater" than x. can use a prediacte instead.
		//=====================================================================
		upper_bound: function(x) {
			if (x instanceof Function)
				return jam.binary_search(this, x).index + 1;
			else
				return jam.binary_search_for(this, x, this._predicate).index + 1;
		},

		lower_bound: function(x) {
			if (x instanceof Function)
				return jam.binary_search(this, x).index;
			else
				return jam.binary_search_for(this, x, this._predicate).index;
		},

		index_of: function(element) {
			var r = jam.binary_search_for(this, element, this._predicate);
			return r.found ? r.index : undefined;
		},

		sort: function() {
			var self = this;
			Array.prototype.sort.call(this, function(lhs, rhs) {
				return self._predicate(lhs, rhs) ? -1 : self._predicate(rhs, lhs) ? 1 : 0;
			});
		}

	}});
	
}());

