
//=====================================================================
// jam.define_class({inheriting: [jam.Sequence, jam.Indexable], as: {
//   
// }})
//=====================================================================
(function(undefined) {

	jam.Set = jam.define_class({inheriting: [jam.Sequence], as: {
		
		default_predicate: function(lhs, rhs) {
			return lhs < rhs;
		},

		init: function(predicate)
		{
			$.extend(this, jam.Sequence, jam.Set);
			this.length = 0;
			predicate = predicate || this.default_predicate;
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

		// abuse the fact that we KNOW this is not a multi-set
		upper_bound: function(element) {
			return jam.binary_search_for(this, element, this._predicate).value;
		},

		lower_bound: function(element) {
			return jam.binary_search_for(this, element, this._predicate).value - 1;
		},

		index: function(element) {
			var result = jam.binary_search_for(this, element, this._predicate);
			if (!result.found) {
				return undefined;
			}
			else {
				return result.value;
			}
		},

		find: function(v) {
			var r = jam.binary_search_for(this, v, this._predicate);
			return r.found ? this[r.value] : undefined;
		},

		sort: function() {
			Array.prototype.sort.call(this, this._predicate);
		}

	}});
	
}());

