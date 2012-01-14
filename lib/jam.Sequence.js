
//=====================================================================
// Sequence
// ----------
//   A Sequence is any data-structure that has properties [0]...[n].
//   That is to say, my_instance[0], my_instance[1], etc. It also has
//   the property .length
//=====================================================================
(function(undefined) {
	jam.Sequence = jam.prototype({
	
	supers: [
		jam.Indexable
	],

	protics: {
		__init__: function()
		{
			$.extend(this, {
				each: jam.curry(jam._each, this),
				filter: jam.curry(jam._filter, this),
				filtered: jam.curry(jam._filtered, this),
				map: jam.curry(jam._map, this),
				fold: jam.curry(jam._fold, this)				
			});
		},

		//=====================================================================
		// insert
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
		},


		//=====================================================================
		// remove
		//=====================================================================
		remove: function(index) {
			Array.prototype.splice(index, 1);
		}

	}})
}());


