
//=====================================================================
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

		add: function(element) {
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

		_balance: function(node_stack, node, depth) {
			var height = this._height(),
			    node_list = []
			    ;

			if (depth > height) {
				debugger;
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
		},

		debug: function() {
			jam.each(this._indexes, function(x) {
				console.dir(x);
			});
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
		//left: function() {return this._left;},
		//right: function() {return this._right;}
	},

	protics: {
		__init__: function(element) {
			this._element = element;
		},
	}});




}());

