
//=====================================================================
/*
var mi = jam.MultiIndex(things, {
	
	tab: {
		access: function(x) {
			return lhs.$tab;
		},
		pred: function(lhs, rhs) {
			return lhs.
		}
	},

	position: function(lhs, rhs) {
		return lhs.$tab.position().left < rhs.$tab.position().left;
	},

	topology: function(lhs, rhs) {
		return lhs.index < rhs.index;
	}
});
*/
//=====================================================================
(function(undefined) {

	jam.MultiIndex = jam.prototype({
	
	statics: {
	},

	datas: {
		_elements: null,
		_indexes: []
	},

	protics: {
		__init__: function(indexes)
		{
			var self = this,
			    chain = undefined
			    ;

			jam.each(indexes, {this_object: this}, function(x, y) {
				this._indexes.push(jam.MultiIndex.Index(y.accessor, y.predicate, chain));
				chain = this._indexes[this._indexes.length - 1];
			});
		},

		insert: function() {
			jam.each(Array.prototype.slice.apply(arguments), {this_object: this}, function(x) {
				console.log("adding: ", x);
				this._indexes[this._indexes.length - 1].add(x);
			});
		},

		debug: function() {
			jam.each(this._indexes, function(x) {
				console.dir(x);
			});
		}
	}});
	










	jam.MultiIndex.Index = jam.prototype({
		supers: [
			jam.Indexable
		],

		datas: {
			_elements: null,
			_accessor: null,
			_predicate: null,
			_accessed_predicate: null,
			_chain: null
		},

		protics: {
			__init__: function(accessor, predicate, chain) {
				console.log(chain);
				this._elements = [];
				this._accessor = accessor;
				this._predicate = predicate || jam.default_predicate;
				this._chain = chain || null;
				var self = this;

				this._accessed_predicate = function(lhs, rhs) {
					return self._predicate(self._accessor.call(lhs), self._accessor.call(rhs));
				}
			},

			add: function(x) {
				if (this._chain)
				{
					var r = this._chain.add(x),
					    ri = this.index_of(x) || 0
					    ;

					console.log("------------------");
					this._chain.each(function(x) {
						console.log(x);
					});
					console.log("==================");
					//console.log("chained!!!!", x, r, ri);
					jam.each(this._elements, {from: ri, this_object: this}, function(x, i) {
						++this._elements[i];
					});

					jam.insert(this._elements, ri, [r]);
					return ri;
				}
				else {
					var r = jam.binary_search_for(this._elements, x, this._accessed_predicate);
					console.log("non-chained: ", r.found, r.index);
					jam.insert(this._elements, r.index, [x]);
					return r.index;
				}
			},

			get: function(i) {
				if (this._chain)
					return this._chain.get(this._elements[i]);
				else
					return this._elements[i];
			},

			has: function(element) {
				throw new "blkjhasdf";
				jam.binary_search_for(this._elements, element, function(lhs, rhs) {
					return this._predicate(this._accessor(lhs), this._accessor(rhs));
				});
			},

			each: function(fn) {
				jam.each(this._elements, {this_object: this}, function(x, i) {
					fn(this.get(i));
				});
			},

			index_of: function(element) {
				var self = this,
				    r = jam.binary_search(this._elements, function(i) {
				    			if (self._chain) {
				    				return self._predicate(self._accessor.call(self._chain.get(i)), self._accessor.call(element)) ? -1 :
				    				       self._predicate(self._accessor.call(element), self._accessor.call(self._chain.get(i))) ? 1 :
				    				       0;
				    			}
				    			else {
				    				throw new "woah there";
				    				return self._predicate(self._accessor(lhs), self._accessor(rhs));
				    			}
				        })
				    ;

				return r.found ? r.index : undefined;
			}
		}
	})
}());

