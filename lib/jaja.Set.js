
//=====================================================================
// 
//=====================================================================
(function(undefined) {

	function jaja_Set() {
		return {};
	}

	$.extend(jaja, {
		Set: function(predicate) {
			return jaja.Set.init.call(new jaja_Set(), predicate);
		}
	});

	$.extend(jaja.Set, {
		default_predicate: function(lhs, rhs) {
			return lhs < rhs;
		},

		init: function(predicate)
		{
			$.extend(this, jaja.Sequence, jaja.Set);
			this.length = 0;
			predicate = predicate || this.default_predicate;
			this._predicate = function(lhs, rhs) {
				return predicate(lhs, rhs) ? -1 : predicate(rhs, lhs) ? 1 : 0;
			};
			
			var set = this;
			jaja.Array("insert").each(function(x) {
				set["_" + x] = set[x];
				delete set[x];
			});


			return this;
		},

		add: function(element)
		{
			var r = jaja.binary_search_for(this, element, this._predicate);
			if (r.found) {
				return false;
			}
			
			this._insert(r.value, [element]);				
			return true;
		},

		// abuse the fact that we KNOW this is not a multi-set
		upper_bound: function(element) {
			return jaja.binary_search_for(this, element, this._predicate).value;
		},

		lower_bound: function(element) {
			return jaja.binary_search_for(this, element, this._predicate).value - 1;
		},

		index: function(element) {
			var result = jaja.binary_search_for(this, element, this._predicate);
			if (!result.found) {
				return undefined;
			}
			else {
				return result.value;
			}
		},

		find: function(v) {
			var r = jaja.binary_search_for(this, v, this._predicate);
			return r.found ? this[r.value] : undefined;
		}

	});
	
}());

