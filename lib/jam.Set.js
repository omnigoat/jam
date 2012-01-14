
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
			$.extend(this, jam.Set);
			this.length = 0;
			predicate = predicate || jam.Set.default_predicate;
			this._predicate = function(lhs, rhs) {
				return predicate(lhs, rhs) ? -1 : predicate(rhs, lhs) ? 1 : 0;
			};
			
			return this;
		},

		add: function(element)
		{
			var r = jam.binary_search_for(this, element, this._predicate);
			if (r.found) {
				return false;
			}
			
			this.insert(r.value, [element]);
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
				return jam.binary_search(this, x).value + 1;
			else
				return jam.binary_search_for(this, x, this._predicate).value + 1;
		},

		lower_bound: function(x) {
			if (x instanceof Function)
				return jam.binary_search(this, x).value;
			else
				return jam.binary_search_for(this, x, this._predicate).value;
		},

		index_of: function(element) {
			var r = jam.binary_search_for(this, element, this._predicate);
			return r.found ? r.value : undefined;
		},

		sort: function() {
			Array.prototype.sort.call(this, this._predicate);
		}

	}});
	
}());

