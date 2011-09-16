


(function(undefined) {
	
	//=====================================================================
	// Indexable
	//=====================================================================
	jaja.Indexable = {
		_reindex: function(i) {
			i = i === undefined ? this.length : i;
			return i >= 0 ? i : i + this.length + 1;
		},

		_default_options: function() {
			return {from: 0, until: this.length, step: 1};
		},

		_optionise: function(options, ignore_reverse)
		{
			options = $.extend(this._default_options(), options);
			options.from = this._reindex(options.from);
			options.until = this._reindex(options.until);

			if (!ignore_reverse && options.reverse) {
				options.step = -options.step;
				var t = options.from;
				options.from = options.until + options.step;
				options.until = t + options.step;
			}
		
			return options;
		}
	};


	//=====================================================================
	// Sequence
	// ----------
	//   A Sequence is any data-structure that has properties [0]...[n].
	// That is to say, my_instance[0], etc.
	//=====================================================================
	jaja.Sequence = $.extend({}, jaja.Indexable,
	{
		//=====================================================================
		// each. rarely needs overriding
		//=====================================================================
		each: function(options, fn, callbacks)
		{
			if (options instanceof Function) {
				jaja.assert(arguments.length === 1, "incorrect arguments");
				callbacks = fn;
				fn = options;
				options = this._default_options();
			}
			else {
				options = this._optionise(options);
			}

			callbacks = callbacks || {};

			var i = options.from, ie = options.until, result = true;
			while (i !== ie && result) ) {
				if (i !== options.from && callbacks.between) {
					callbacks.between.call(options.as, this[i - 1], this[i], i - 1, i, this);
				}
				result = fn.call(options.as, this[i], i, this);
				i += options.step;
			}
			
			if (result && callbacks.success) {
				callbacks.success.call(options.as, this, options.from, options.to);
			}
			else if (!result && callbacks.failure) {
				callbacks.failure.call(options.as, this, options.from, options.to, i);
			}

			return this;
		},


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
		},
	});

}());