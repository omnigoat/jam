
//=====================================================================
// Sequence
// ----------
//   A Sequence is any data-structure that has properties [0]...[n].
//   That is to say, my_instance[0], my_instance[1], etc. It also has
//   the property .length
//=====================================================================
(function(undefined) {
	jam.Sequence = jam.define_class({inheriting: [jam.Indexable], as: {
		init: function()
		{
			$.extend(this, {
				each: jam._each.partial(this),
				filter: jam._filter.partial(this),
				filtered: jam._filtered.partial(this),
				map: jam._map.partial(this),
				fold: jam._fold.partial(this)				
			});
		},

		//=====================================================================
		//
		//=====================================================================
		insert: function(index, elements)
		{
			index = this._reindex(index);

			var elements_length = elements.length,
			    i = this.length - 1,
			    ie = index - 1,
			    j = elements_length - 1,
			    je = -1
			    ;
			
			for (; i != ie; --i) {
				this[i + elements_length] = this[i];
			}

			for (i = index + j; j != je; --i, --j) {
				this[i] = elements[j];
			}

			this.length += elements_length;
			return this;
		}
	}})
}());