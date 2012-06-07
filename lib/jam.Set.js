
//=====================================================================
// 
//=====================================================================
(function(undefined) {

	jam.Set = jam.prototype({
	
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
			this._tree = jam.blocks.BalancedBinaryTree(this._predicate);
			return this;
		},

		insert: function(element)	{
			return this._tree.insert(element);
		},

		insert_all: function(elements)
		{
			var set = this;
			jam.each(elements, function(x) {
				set.insert(x);
			});
		},

		has: function(element) {
			return this.find(element) != null;
		},

		find: function(element) {
			return this._tree.find(element);
		},

		each: function(fn) {
			this._tree.each(fn);
		},

		lower_bound: function(element) {
			return this._tree._max(this._tree.find(element));
		}

		//=====================================================================
		// upper_bound
		// -------------
		//   Returns the index pointing to the first element in the set that
		//   is "greater" than x. can use a prediacte instead.
		//=====================================================================
		/*
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
		}

		*/
	}});
	
}());

