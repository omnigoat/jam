
(function(undefined){
	function jaja_Tree() { return {}; }

	$.extend(jaja, {
		Tree: function(options) {
			return jaja.Tree.init.call(new jaja_Tree(), options);
		}
	});


	function NaturalNode(value) {
		return new NaturalNode.init(value);
	}

	$.extend(NaturalNode, {
		init: function(value) {
			this._children = [];
			this._value = value;
		},

		value: function() {
			return this._value;
		},

		// adds a value as a child
		add: function(v) {
			this._children.push( NaturalNode(v) );
			return this;
		},

		// removes all children matching the predicate
		remove: function(v, pred) {
			this._children = jaja.Array();
			this._children.each({step: 2}, function() {
				
			});
		},


	});




	$.extend(jaja.Tree, {
		init: function() {
			$.extend(this, jaja.Tree);
			this._root = undefined;
			return this;
		},

		root: function() {
			return this._root;
		},

		clone: function(options) {
			// copy_on_write, etc
		}
	});
});