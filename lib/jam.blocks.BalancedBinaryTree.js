/*
   6
 4   8
3 5 7 9
*/

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
		_begin: null,
		_end: null,
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
			var node;

			if (this._root === null) {
				node = this._root = jam.blocks.BalancedBinaryTree.Node(element);
			}
			else {
				var depth = 0;
				node = this._root;

				while (node) {
					++depth;
					if ( this._predicate(element, node.element) ) {
						if (node.left) {
							node = node.left;
						}
						else {
							this._link_node(node, "left", jam.blocks.BalancedBinaryTree.Node(element));
							node = this._balance(node.left, depth);
							break;
						}
					}
					else {
						if (node.right) {
							node = node.right;
						}
						else {
							this._link_node(node, "right", jam.blocks.BalancedBinaryTree.Node(element));
							node = this._balance(node.right, depth);
							break;
						}
					}
				}
			}

			if (!this._begin || element < this._begin.element) this._begin = this._min();
			if (!this._end || element > this._end.element) this._end = this._max();

			return node;
		},

		remove: function(element) {
			var self = this,
			    node = this._find(element),
			    node_side = node.parent && node.parent.right === node ? "right" : "left"
			    ;

			if (node.prev)
				node.prev.next = node.next;
			if (node.next)
				node.next.prev = node.prev;

			if (node) {
				if (node.left && node.right) {
					var replacement = this[node_side == "left" ? "_max" : "_min"](node[node_side]),
					    r_parent = replacement.parent
					    ;

					r_parent.left === replacement ? r_parent.left = null : r_parent.right = null;

					replacement.left = node.left;
					replacement.right = node.right;
					this._link_node(node.parent, node_side, replacement);
				}
				else if (node.left) {
					this._link_node(node.parent, node_side, node.left);
				}
				else if (node.right) {
					this._link_node(node.parent, node_side, node.right);
				}
				else {
					this._link_node(node.parent, node_side, null);
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

		find: function(element) {
			return this._find(element);
		},

		each: function (fn) {
			var node = this._min();
			while (node) {
				fn(node.element);
				node = node.next;
			}
		},

		flatten: function() {
			var nl = [];
			this._build_node_list(this._root, nl);
			return nl;
		},

		// resort: function(node) {
		// 	while (node) {
		// 		var is_left = node.parent.left === node;

		// 		if (is_left) {
		// 			if ( this._predicate(node.parent.element, node.element) ) {
		// 				var t = node.parent.element;
		// 				node.parent.element = node.element;
		// 				node.element = t;
		// 				node = node.parent;
		// 			}
		// 		}
		// 	}
		// },

		_link_node: function(parent, side, new_node) {
			if (parent) {
				var link_dir = side == "right" ? "next" : "prev",
				    other_dir = side == "right" ? "prev" : "next",
				    predicate = side == "right" ? this._predicate : jam.curry(this._predicate, _2, _1)
				    ;

				parent[link_dir] = parent[side] = new_node;
				if (new_node) {
					new_node.parent = parent;
					new_node[link_dir] = this._ancestor(parent[side], predicate);
					new_node[other_dir] = parent;
				}
			}
			else {
				this._root = new_node;
				new_node.parent = null;
			}
		},

		// node-stack required! this function does not mutate it
		_ancestor: function(node, predicate) {
			var best = node,
			    original = node,
			    node = node.parent
			    ;

			for (; node; node = node.parent) {
				if (predicate(best.element, node.element)) {
					best = node;
				}
			}

			return best === original ? null : best;
		},

		_min: function(node) {
			if (node === undefined) node = this._root;
			while (node && node.left) {
				node = node.left;
			}
			return node;
		},

		_max: function(node) {
			if (node === undefined) node = this._root;
			while (node && node.right) {
				node = node.right;
			}
			return node;
		},

		_find: function(element) {
			var node = this._root;
			while (node) {
				if (this._predicate(node.element, element)) {
					//console.log("pushing " + node.element);
					node = node.right;
				}
				else if (this._predicate(element, node.element)) {
					//console.log("pushing " + node.element);
					node = node.left;
				}
				else {
					return node;
				}
			}
			return null;
		},

		_balance: function(node, depth) {
			var height = this._height(),
			    node_list = [],
			    old_node = node
			    ;

			if (depth > height) {
				var scapegoat = this._find_scapegoat(node),
				    scapegoat_parent = scapegoat.parent,
				    root = scapegoat_parent === null,
				    side = !root && scapegoat_parent.left === scapegoat ? "left" : "right",
				    node_list = []
				    ;

				this._build_node_list(scapegoat, node_list);
				node = this._rebalance_from_scapegoat(scapegoat, node_list);
				if (root) {
					this._root = node;
					node.parent = null;
				}
				else {
					scapegoat_parent[side] = node;
					node.parent = scapegoat_parent;
				}
			}

			return old_node;
		},

		_find_scapegoat: function(node, child_node, child_size) {
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
				node = node.parent;
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

				node.parent = scapegoat;
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
		right: null,
		prev: null,
		next: null,
		parent: null
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

