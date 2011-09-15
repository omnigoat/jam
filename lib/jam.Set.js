
//=====================================================================
// 
//=====================================================================
(function(undefined) {

	function jam_Set() {
		return {};
	}

	$.extend(jam, {
		Set: function(predicate) {
			return jam.Set.init.call(new jam_Set(), predicate);
		}
	});

	$.extend(jam.Set, {
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
			
			var set = this;
			jam.Array("insert").each(function(x) {
				set["_" + x] = set[x];
				delete set[x];
			});


			return this;
		},

		add: function(element)
		{
			var r = jam.binary_search_for(this, element, this._predicate);
			if (r.found) {
				return false;
			}
			
			this._insert(r.value, [element]);				
			return true;
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
		}

	});
	
}());

