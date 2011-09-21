


(function(undefined) {
	
	//=====================================================================
	// Sequence
	// ----------
	//   A Sequence is any data-structure that has properties [0]...[n].
	// That is to say, my_instance[0], etc.
	//=====================================================================
	jam.Sequence = jam.define_class().as({
		init: function()
		{
			$.extend(this, {
				each: jam.each.partial(this),
				filter: jam.filter.partial(this)
			});
		}

		// //=====================================================================
		// // has. overridden for 
		// //=====================================================================
		has: function(element, pred)
		{
			pred = pred || function(lhs, rhs) {
				return lhs == rhs;
			}
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
	});

}());