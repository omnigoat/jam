
//=====================================================================
//
//  BalancedBinaryTree
//  ====================
//    Pretty self-explanatory. Uses the scapegoat algorithm.
//
//=====================================================================
(function(undefined) {
	jam.blocks = jam.blocks || {};

	jam.blocks.BalancedBinaryTree = jam.prototype({
	
	statics: {
	},

	datas: {
		_root: null,
		_node_count: 0,
		_max_node_count: 0,
		_alpha: 0.5,
		_one_over_alpha: 1 / 0.5,
		_predicate: function(lhs, rhs) {
			return lhs < rhs;
		}
	},

	protics: {
		__init__: function(predicate)
		{
			if (predicate)
				this._predicate = predicate;
		},

		insert: function(element) {
			++this._node_count;
			this._max_node_count = Math.max(this._node_count, this._max_node_count);

			if (this._root === null) {
				this._root = jam.blocks.BalancedBinaryTree.Node(element);
				return this._root;
			}
			else {
				var depth = 0,
				    node = this._root,
				    node_stack = []
				    ;

				while (node) {
					++depth;
					node_stack.push(node);
					if ( this._predicate(element, node.element) ) {
						if (node.left) {
							node = node.left;
						}
						else {
							node.left = jam.blocks.BalancedBinaryTree.Node(element);
							this._balance(node_stack, node.left, depth);
							break;
						}
					}
					else {
						if (node.right) {
							node = node.right;
						}
						else {
							node.right = jam.blocks.BalancedBinaryTree.Node(element);
							this._balance(node_stack, node.right, depth);
							break;
						}
					}
				}

			}
		},

		remove: function(element) {
			var self = this,
			    node_stack = [],
			    node = this._find(element, node_stack),
			    node_parent = node_stack.pop(),
			    node_side = node_parent ? node_parent.left === node ? "left" : "right" : undefined
			    ;

			console.dir(node_stack);

			function set_node(n) {
				if (node_parent)
					node_parent[node_side] = n;
				else
					self._root = n;
			}

			if (node) {
				if (node.left && node.right) {
					var replacement_node_stack = [],
					    replacement = this[node_side == "left" ? "_max" : "_min"](node, replacement_node_stack),
					    replacement_node_parent = replacement_node_stack.pop()
					    ;

					replacement.left = node.left;
					replacement.right = node.right;
					set_node(replacement);
					replacement_node_parent.left === replacement ?
						replacement_node_parent.left = null : replacement_node_parent.right = null;
				}
				else if (node.left) {
					//node_parent[node_side] = node.left;
					set_node(node.left);
				}
				else if (node.right) {
					//node_parent[node_side] = node.right;
					set_node(node.right);
				}
				else {
					//node_parent[node_side] = null;
					set_node(null);
				}
			}
		},

		has: function(element) {
			return this._find(element) !== null;
		},

		min: function() {
			return this._min().element;
		},

		max: function() {
			return this._max().element;
		},

		_min: function(node, node_stack) {
			if (node === undefined) node = this._root;
			while (node && node.left) {
				node_stack && node_stack.push(node);
				node = node.left;
			}
			return node;
		},

		_max: function(node, node_stack) {
			if (node === undefined) node = this._root;
			while (node && node.right) {
				node_stack && node_stack.push(node);
				node = node.right;
			}
			return node;
		},

		_find: function(element, node_stack) {
			var node = this._root;
			while (node) {
				if (this._predicate(node.element, element)) {
					console.log("pushing " + node.element);
					node_stack && node_stack.push(node);
					node = node.right;
				}
				else if (this._predicate(element, node.element)) {
					console.log("pushing " + node.element);
					node_stack && node_stack.push(node);
					node = node.left;
				}
				else {
					return node;
				}
			}
			return null;
		},

		_balance: function(node_stack, node, depth) {
			var height = this._height(),
			    node_list = []
			    ;

			if (depth > height) {
				var scapegoat = this._find_scapegoat(node_stack, node),
				    scapegoat_parent = node_stack.pop(),
				    root = scapegoat_parent === undefined,
				    side = !root && scapegoat_parent.left === scapegoat ? "left" : "right"
				    ;

				this._build_node_list(scapegoat, node_list);
				node = this._rebalance_from_scapegoat(node, node_list);
				if (root) {
					this._root = node;
				}
				else {
					scapegoat_parent[side] = node;					
				}
			}
		},

		_find_scapegoat: function(node_stack, node, child_node, child_size) {
			while (node) {
				var is_left = (child_node !== null && child_node === node.left),
				    is_right = (child_node !== null && child_node === node.right),
				    left_size = is_left ? child_size : this._size(node.left),
				    right_size = is_right ? child_size : this._size(node.right),
				    node_size = this._size(node, left_size, right_size)
				    ;

				if (left_size > this._alpha * node_size || right_size > this._alpha * node_size) {
					return node;
				}

				child_node = node;
				child_size = node_size;
				node = node_stack.pop();
			}

			return node;
		},

		_build_node_list: function(node, node_list) {
			if (node === null) return;
			this._build_node_list(node.left, node_list);
			node_list.push(node);
			this._build_node_list(node.right, node_list);
		},

		_rebalance_from_scapegoat: function(scapegoat, node_list) {
			if (node_list.length > 0) {
				var median_index = node_list.length >> 1,
				    node = node_list[median_index]
				    ;
				node.left = this._rebalance_from_scapegoat(node, node_list.slice(0, median_index));
				node.right = this._rebalance_from_scapegoat(node, node_list.slice(median_index + 1, node_list.length));
				return node;
			}
			return null;
		},

		_size: function(node, left_size, right_size) {
			return node === null ? 0 : 1 + (left_size ? left_size : this._size(node.left)) + (right_size ? right_size : this._size(node.right));
		},

		_height: function() {
			return Math.floor(Math.log(this._node_count) / Math.log(this._one_over_alpha));
		}
	}});
	

	jam.blocks.BalancedBinaryTree.Node = jam.prototype({
	datas: {
		_element: null,
		left: null,
		right: null
	},

	accers: {
		element: function() {return this._element;}
	},

	protics: {
		__init__: function(element) {
			this._element = element;
		},
	}});




}());

