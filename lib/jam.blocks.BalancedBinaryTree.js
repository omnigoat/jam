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

		insert_all: function(elements) {
			jam.each(elements, {this_object: this}, function(x) {
				this.insert(x);
			});
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
							//this._link_node(node, "left", jam.blocks.BalancedBinaryTree.Node(element));
							node._add_child("left", jam.blocks.BalancedBinaryTree.Node(element));
							node = this._balance(node.left, depth);
							break;
						}
					}
					else {
						if (node.right) {
							node = node.right;
						}
						else {
							//this._link_node(node, "right", jam.blocks.BalancedBinaryTree.Node(element));
							node._add_child("right", jam.blocks.BalancedBinaryTree.Node(element));
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
			    node = this._find(element)
			    node_side = node.parent && node.parent.right === node ? "right" : "left"
			    ;

			if (node == null)
				return;

			// find a replacement node to fill our void
			var replacement = null;
			if (node.left && node.right) {
				replacement = this[node_side == "left" ? "_max" : "_min"](node);
				var r_parent = replacement.parent;

				r_parent._set(r_parent.left === replacement ? "left" : "right", null);
				replacement._set("left", node.left, "right", node.right);
			}
			else if (node.left) {
				replacement = node.left;
			}
			else if (node.right) {
				replacement = node.right;
			}

			if (node.parent)
				node.parent._add_child(node_side, replacement);
			else
				this._root = replacement;
		},

		all_prefix: function() {
			return jam.blocks.BalancedBinaryTree.PrefixRange(this._root);
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

		each_prefix: function(fn, _node) {
			_node = _node === undefined ? this._root : _node;
			if (_node == null) return;
			fn(_node);
			each_prefix(fn, _node.left);
			each_prefix(fn, _node.right);
		},

		each_infix: function(fn, _node) {
			_node = _node === undefined ? this._root : _node;
			if (_node == null) return;
			each_prefix(fn, _node.left);
			fn(_node);
			each_prefix(fn, _node.right);
		},

		each_postfix: function(fn, _node) {
			_node = _node === undefined ? this._root : _node;
			if (_node == null) return;
			each_prefix(fn, _node.left);
			each_prefix(fn, _node.right);
			fn(_node);
		},



		flatten: function() {
			var nl = [];
			this._build_node_list(this._root, nl);
			return nl;
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

		_find: function(element)
		{
			var node = this._root;

			while (node) {
				if (this._predicate(node.element, element)) {
					if (node.right)
						node = node.right;
					else
						break;
				}
				else if (this._predicate(element, node.element)) {
					if (node.left)
						node = node.left;
					else
						break;
				}
				else {
					break;
				}
			}

			return node;
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
					node._set("parent", null);
				}
				else {
					scapegoat_parent._set(side, node);
					node._set("parent", scapegoat_parent);
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

				node._set(
					"parent", scapegoat,
					"left", this._rebalance_from_scapegoat(node, node_list.slice(0, median_index)),
					"right", this._rebalance_from_scapegoat(node, node_list.slice(median_index + 1, node_list.length))
				);
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



	//=====================================================================
	//
	//
	//
	//=====================================================================
	jam.blocks.BalancedBinaryTree.Node = jam.prototype({
	datas: {
		_element: null,
		_left: null,
		_right: null,
		_prev: null,
		_next: null,
		_parent: null
	},

	accers: {
		element: function() {return this._element;},
		left: function() {return this._left;},
		right: function() {return this._right;},
		prev: function() {return this._prev;},
		next: function() {return this._next;},
		parent: function() {return this._parent;}
	},

	protics: {
		__init__: function(element) {
			this._element = element;
		},

		// "child" is a newly-created node, which we know to be a leaf (once added)
		_add_child: function(side, child)
		{
			var next = (side == "right" ? "next" : "prev"),
			    prev = (side == "right" ? "prev" : "next"),
			    predicate = (side == "right" ? this._predicate : jam.curry(this._predicate, _2, _1))
			    ;

			if (child) {
				child._set(
					"parent", this,
					next, this[next],
					prev, this
				);

				if (this[next]) {
					this[next]._set(prev, child);
				}

				this._set(
					side, child,
					next, child
				);
			}
			else {
				if (this[side]) {
					this._set(
						side, child,
						next, this[side][next]
					);
					this[next]._set(prev, this);
				}
			}
		},

		_set: function() {
			var args = Array.prototype.slice.call(arguments);

			for (var i = 0, ie = args.length; i != ie; i += 2) {
				this["_" + args[i]] = args[i + 1];
			}
		}

	}});




	//=====================================================================
	//
	//
	//
	//=====================================================================
	jam.blocks.BalancedBinaryTree.Range = jam.prototype({
	supers: [jam.Range],

	datas: {
		_begin: null,
		_end: null,
		_traversal: null
	},

	protics: {
		__init__: function(begin, end, traversal) {
			this._begin = begin;
			this._end = end;
			this._traversal = traversal;

			if (this._traversal == "sequenece") {
				this._pop_head = function() {
					this._begin = this._begin.next;
				}
			}
			else if (this._traversal == "prefix") {
				this._pop_head = function() {
					this._begin = this._begin.left;
				}
			}
		},


		_headed: function() {
			return this._begin;
		},

		_tailed: function() {
			return this.empty ? null : jam.blocks.BalancedBinaryTree.Range(this.clone().pop_head().head, this._end, this._traversal);
		},

		_pop_sequence: function() {
			this._begin = this._begin.next;
		},

		_pop_prefix: function() {
			var state = "here, left, right";

			if (this._state = "visited") {
				this._begin = this._begin.parent;
				this._state = "non-visited";
			}
			else if (this._state = "non-visited") {
				
				//this._begin = this._begin.left || this._begin.right || 
			}
			
		},

		pop_head: function() {
			this._pop_head();
		},

		clone: function() {
			return jam.blocks.BalancedBinaryTree.Range(this._begin, this._end, this._traversal);
		}
	}});


	//=====================================================================
	//
	//
	//
	//=====================================================================
	jam.blocks.BalancedBinaryTree.PrefixRange = jam.prototype({

	supers: [jam.Range],

	datas: {
		_nodes: []
	},

	protics: {
		__init__: function(begin) {
			this._nodes.push(begin);
		},


		_headed: function() {
			return this._nodes[0].element;
		},

		_tailed: function() {
			return this.empty ? null : jam.blocks.BalancedBinaryTree.Range(this.clone().pop_head().head, this._end);
		},

		_emptied: function() {
			return this._nodes.length == 0;
		},

		pop_head: function() {
			var head = this._nodes.shift();
			Array.prototype.unshift.call(this._nodes, head.left, head.right);
			while (this._nodes[0] === null)
				this._nodes.shift();
			this._head = null;
		},

		clone: function() {
			return jam.blocks.BalancedBinaryTree.Range(this._begin, this._end);
		}
	}});

























	jam.test("BalancedBinaryTree",

		{should: "insert elements correctly with no balancing required", ie: function() {
			var elements = [6, 4, 8, 5, 3, 7, 9];
			var bbt = jam.blocks.BalancedBinaryTree();
			bbt.insert_all(elements);

			this(bbt._root.element).should_equal(6);
			this(bbt._root.left.element).should_equal(4);
			this(bbt._root.right.element).should_equal(8);
			this(bbt._root.left.left.element).should_equal(3);
			this(bbt._root.left.right.element).should_equal(5);
			this(bbt._root.right.left.element).should_equal(7);
			this(bbt._root.right.right.element).should_equal(9);
		}},

		{should: "correctly balance", ie: function() {
			var elements = [6, 4, 8, 2, 3];
			var bbt = jam.blocks.BalancedBinaryTree();
			bbt.insert_all(elements);

			this(bbt._root.element).should_equal(6);
			this(bbt._root.left.element).should_equal(3);
			this(bbt._root.left.left.element).should_equal(2);
			this(bbt._root.left.right.element).should_equal(4);
			this(bbt._root.right.element).should_equal(8);
		}},

		{should: "remove leaf nodes correctly", ie: function() {
			var elements = [6, 4, 8];
			var bbt = jam.blocks.BalancedBinaryTree();
			bbt.insert_all(elements);
			bbt.remove(4);

			this(bbt._root.element).should_equal(6);
			this(bbt._root.left).should_equal(null);
			this(bbt._root.right.element).should_equal(8);
		}},

		{should: "remove non-leaf nodes correctly", ie: function() {
			var elements = [6, 4, 8, 3, 5];
			var bbt = jam.blocks.BalancedBinaryTree();
			bbt.insert_all(elements);
			bbt.remove(4);
			
			this(bbt._root.element).should_equal(6);
			this(bbt._root.left.element).should_equal(5);
			this(bbt._root.left.left.element).should_equal(3);
			this(bbt._root.left.right).should_equal(null);
			this(bbt._root.right.element).should_equal(8);
		}},

		{should: "iterate prefix correctly", ie: function() {
			var elements = [6, 4, 8, 3, 5];
			var bbt = jam.blocks.BalancedBinaryTree();
			bbt.insert_all(elements);

			var range = bbt.all_prefix();
			debugger;
			console.log(range.head);
			range.pop_head();
			console.log(range.head);
			range.pop_head();
			console.log(range.head);
			range.pop_head();
		}}
	);

}());


