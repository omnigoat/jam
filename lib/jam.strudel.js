(function(undefined) {


	jQuery.fn.sortElements = (function(){
	 
	    var sort = [].sort;
	 
	    return function(comparator, getSortable) {
	 
	        getSortable = getSortable || function() {return this;};
	        
	        comparator = comparator || function(a, b) {
						return $(a).text() > $(b).text() ? 1 : -1;
					};
	 
	        var placements = this.map(function(){
	 
	            var sortElement = getSortable.call(this),
	                parentNode = sortElement.parentNode,
	 
	                // Since the element itself will change position, we have
	                // to have some way of storing its original position in
	                // the DOM. The easiest way is to have a 'flag' node:
	                nextSibling = parentNode.insertBefore(
	                    document.createTextNode(''),
	                    sortElement.nextSibling
	                );
	 
	            return function() {
	 
	                if (parentNode === this) {
	                    throw new Error(
	                        "You can't sort elements if any one is a descendant of another."
	                    );
	                }
	 
	                // Insert before flag:
	                parentNode.insertBefore(this, nextSibling);
	                // Remove flag:
	                parentNode.removeChild(nextSibling);
	 
	            };
	 
	        });
	 
	        return sort.call(this, comparator).each(function(i){
	            placements[i].call(getSortable.call(this));
	        });
	 
	    };
	 
	})();



	jam.melk = {};

	function stack_node() {return this;}

	jam.melk.Stack = jam.prototype({

		init: function(object) {
			this.length = 0;
			if (object !== undefined) {
				this.push(object);
			}
			return this;
		},

		methods: {
			get: function(id, raw)
			{
				var value_of = false;
				if (id[id.length - 1] == "!") {
					id = id.slice(0, id.length - 1);
					value_of = true;
				}

				var parts = id.split("."),
				    initial_part = parts.shift(),
				    node
				    ;
				
				for (var i = this.length - 1, ie = -1; i != ie; --i) {
					if (this[i][initial_part] !== undefined) {
						node = this[i][initial_part];
						break;
					}
				}

				if (node === undefined) {
					return raw ? undefined : id;
				}

				while (parts.length > 0 && node !== undefined) {
					if (node instanceof stack_node) {
						node = node.value[parts.shift()];
					}
					else {
						node = node[parts.shift()];
					}
				}

				if (!raw && node instanceof stack_node) {
					if (value_of) {
						node = node.value;
					}
					else {
						node = node.key;
					}
				}

				return node;
			},

			get_joined: function(name, joiner) {
				var result = [], e;
				for (var i = 0, ie = this.length; i != ie; ++i) {
					if ((e = this[i][name]) !== undefined) {
						result.push(e);
					}
				}

				return result.join(joiner || ".");
			},

			push: function(object) {
				for (var name in object) {
					this[name] = object[name];
				}
			
				Array.prototype.push.call(this, object);
			},

			push_node: function(name, key, value) {
				var k = new stack_node();
				k.key = key;
				k.value = value;
				var j = {};
				j[name] = k;
				this.push(j);
			},

			pop: function()
			{
				var last_stack = Array.prototype.pop.call(this);
				for (var name in last_stack) {
					delete this[name];
				}

				for (var name in last_stack) {
					this[name] = this.get(name, true);;
				}
			}
		}
	});


	$.extend(jam.melk, {
		_loop_test: /for\s+(\w+)\s+in\s+([\w\.]+)/,
		_selector_test:  /(?:(\w+)(?:#(\w+))?([\w\.\-_]*)((?:\[[\w-]+\=.+\])*)|\.)(?:\s~\s(.+))?/,
		_capture_test: /in (.+)/,
		_attribute_test: /@(\w+)(?:\s\s)(.+)/,
		_def_test: /(def|root)\s((?:\w+)(?:\.\w+)*)(?:\s(\w+))?/,
		_call_test: /call\s(.+)\s~\s(.+)/,
		_if_zero_test: /if\-not\-zero/,
		_if_test: /if\s([\w\.]+(?:\sor\s[\w\.]+)*)/,
		_sort_test: /sort\s(.+)/,
		_directive: /\{\{(?:(link|path)\s)?([\w\.\!]+)\}\}/g,

		render: function(template, data, rule, key)
		{
			var s =  $("<div />"),
			    stack = jam.melk.Stack({
			    	template: template,
			    	data: data.data,
			    	dom_parent: s
			    }),
			    path = document.URL.split("/"),
			    doc_start = path.indexOf(data.name),
			    state = {":path": path.slice(doc_start)}
			    ;
			
			var current_data = data.data;
			$.each(key, function(i, x) {
				current_data = current_data[x];
			});

			stack.push_node("this", key[key.length - 1] || data.name, current_data);
			
			jam.melk._render_children(stack, state, stack.template[rule]);
			
			
			return {
				into: function($o) {
					$o.append(s.children());
				},

				value: function() {
					return s;
				}
			};
		},

		_render: function(stack, state)
		{
			var result;
			
			// object
			if (typeof stack.t_node === 'object')
			{
				var key = Object.keys(stack.t_node)[0],
				    value = stack.t_node[key],
				    regex
				    ;

				if (regex = key.match(jam.melk._loop_test)) {
					jam.melk._render_loop(stack, state, regex[1], regex[2], value);
				}
				// if-not-zero
				else if (regex = key.match(jam.melk._if_zero_test))
				{
					if (stack.index !== 0) {
						jam.melk._render_children(stack, state, value);
					}
				}
				// if
				else if (regex = key.match(jam.melk._if_test)) {
					jam.if_any(regex[1].split(" or "), function() {
						return jam.if_all(this.split(" and "), function() {
							return stack.get(this, true) !== undefined;
						});
					},
					function() {
						jam.melk._render_children(stack, state, value);
					},
					function() {
						if (stack.t_node["else"] !== undefined)
							jam.melk._render_children(stack, state, stack.t_node["else"]);
					});
				}
				// new parent object
				else if (regex = key.match(jam.melk._capture_test)) {
					stack.push({dom_parent: $(regex[1])});
					jam.melk._render_children(stack, state, value);
					stack.pop();
				}
				// new element that has child elements
				else if (regex = key.match(jam.melk._selector_test))
				{
					var e = jam.melk._render_element(stack, state, regex);
					stack.push({dom_parent: e});
					jam.melk._render_children(stack, state, value);
					stack.pop();
				}

			}
			// string
			else if (typeof stack.t_node === 'string') {
				var regex;

				if (stack.t_node === ".") {
					stack.dom_parent.append( jam.melk._parse_text(stack.get(stack.t_value)) );
				}
				
				// calling function
				else if (regex = stack.t_node.match(jam.melk._call_test)) {
					var path = stack.get(regex[2], true).path ? stack.get(regex[2], true).path.concat() : undefined;
					
					stack.push_node(
						"this",
						stack.get(regex[2]),
						stack.get(regex[2], true).value
					);
					
					stack.get("this", true).path = path;
					jam.melk._render_children(stack, state, stack.template[regex[1]]);
					stack.pop();
				}

				// sorting
				else if (regex = stack.t_node.match(jam.melk._sort_test)) {
					var $elements = stack.dom_parent.find(regex[1])
					    $e2 = $elements;

					$elements.sortElements();
				}

				// new child element
				else if ( (regex = stack.t_node.match(jam.melk._selector_test)) !== null ) {
					if (regex[1] === ".") {
						jam.melk._render_element(stack, state, value);
					}
					jam.melk._render_element(stack, state, regex);
				}
			}
		},


		_render_children: function(stack, state, children) {
			jam.each(children, function(x, i) {
				stack.push({t_node: x});
				jam.melk._render(stack, state);
				stack.pop();
			});
		},


		_render_element: function(stack, state, regex) {
			var e = jam.melk._node(regex, stack.dom_parent);

			if (regex[5] !== undefined) {
				e.html( jam.melk._parse_text(stack, regex[5]) );
			}

			if (regex[4] !== "") {
				var k = regex[4].slice(1, regex[4].length - 1).split("][");
				jam.each(k, function(x, i) {
					var pieces = x.split("="),
					    value = jam.melk._parse_text(stack, pieces[1], false)
					    ;
					e.attr(pieces[0], value);
				});
			}

			return e;
		},


		_render_loop: function(stack, state, iterator, range, children)
		{
			var n = stack.get(range);

			state[":path"].push(range.split(".").pop());

			// for each x in data
			var data_index = 0;
			jam.each(n, function(value, key)
			{
				// an object's key and value are obvious, but an array's key and value
				// would be the index and the element in question. we move things around
				// for arrays - discarding the index, moving the element to the key, and
				// just filling in the value as null.
				if (Array.isArray(n)) {
					stack.push_node(iterator, key + 1, value);
				}
				else {
					stack.push_node(iterator, key, value);
				}

				// remember what data key and value we're using (works for both objects and arrays)
				stack.push({index: data_index, d_key: key, d_value: value});
				// remember path, too
				state[":path"].push(key);
				stack.get(iterator, true).path = state[":path"].concat();


				

				// if a function is the value of the template, then we call the function once for
				// each data associated
				if (typeof children === "function") {
					children(stack);
				}
				// if instead it is an object, render each key
				else {
					jam.each(children, function(x, i) {
						stack.push({t_node: x});
						jam.melk._render(stack, state);
						stack.pop();
					});
				}

				state[":path"].pop();
				stack.pop();
				stack.pop();
				++data_index;
			});
			state[":path"].pop();
		},

		_node: function(regex, dom_parent)
		{
			var tag = regex[1],
			    id = regex[2],
			    classes = regex[3].split(".").slice(1),
			    clone_expr = regex[6],
			    e = undefined
			    ;
			
			if (clone_expr !== undefined) {
				e = $(clone_expr).clone();
			}

			if (e === undefined) {
				e = $("<" + tag + (id !== undefined ? "id='" + id + "'" : "") + (classes.length > 0 ? " class='" + classes.join(" ") + "'" : "") + " />");
			}

			e.appendTo(dom_parent);

			return e;
		},

		_hyperlink: function(stack, name) {
			var addendum = stack.get(name, true).path,
			    path = document.URL.split("/").slice(0, 4).concat(addendum)
			    ;
			
			return path.join("/");
		},


		_parse_text: function(stack, text, force_path)
		{
			if (force_path) {
				return jam.melk._hyperlink(stack, text);
			}
			
			var old_text = text + "";
			//var lookup = stack.get(text);
			//if (lookup !== undefined) {
			//	text = lookup;
			//}
			
			var not_url = text.match(/#\{(link|path)/) == null;
			text = text.replace(jam.melk._directive, function(str, prefix, name) {
				var value = stack.get(name);
				if (prefix === "link") {
					value = "<a href='" + jam.melk._hyperlink(stack, name) + "'>" + value + "</a>";
				}
				else if (prefix === "path") {
					value = jam.melk._hyperlink(stack, name);
				}

				return value;
			});

			text = text.replace(/\{\{\{(?:(.+):)?\n(.+)\n\}\}\}/, function(str, one, two) {
				var cls = "";
				if (one !== undefined) {
					cls = "class=\"brush: " + one + "\"";
				}
				return "<pre " + cls + ">" + two + "</pre>";
			});
			
			
			return text;
		}

	});
})();

