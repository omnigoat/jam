(function(undefined) {

	var jj = {};
	jj.marm = {};

	(function(undefined) {
		function stack_node() {
			return this;
		}

		$.extend(jj.marm, {
			Stack: function() {
				if (this.constructor == jj.marm.Stack) {
					return this;
				}

				return jj.marm.Stack.init.apply(new jj.marm.Stack(), arguments);
			}
		});

		$.extend(jj.marm.Stack, {
			init: function(object) {
				$.extend(this, jj.marm.Stack);
				this.length = 0;
				if (object !== undefined) {
					this.push(object);
				}
				return this;
			},

			get: function(id, raw) {
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
					node = node.key;
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
		});


	})();








	jj.render = function(template, data, starting_function)
	{
		var data_key = data.key;
		data = data.value;
		var s =  $("<div />"),
		    stack = jj.marm.Stack({
		    	template: template,
		    	data: data,
		    	dom_parent: s
		    }),
		    state = {":path": [data_key]}
		    ;
		
		stack.push(data);
		// DO THIS FIRST
		
		// first pass, understand the functions
		$.each(stack.template, function(key, value) {
			stack.push({
				t_key: key,
				t_value: value
			});
			jj.render._impl(stack, state);
			stack.pop();
		});

		// second pass, run the root rule
		stack.push({
			t_key: "call " + (starting_function || state[":root-name"]),
			d_key: data_key,
			d_value: stack.data
		});
		jj.render._impl(stack, state);

		
		
		return {
			into: function($o) {
				$o.append(s);
			},

			value: function() {
				return s;
			}
		};
	};

	jj.render._loop_test = /for\s+(\w+)\s+in\s+([\w\.]+)/;
	jj.render._selector_test =  /~?(\w+)(?:#(\w+))?((\.\w+)*)(?:\s+from\s+(\$|jQuery)\((.+)\))?/;
	jj.render._attribute_test = /@(\w+)/;
	jj.render._def_test = /(def|root)\s((?:\w+)(?:\.\w+)*)(?:\s(\w+))?/;
	jj.render._call_test = /call\s+((?:\w+)(?:\.\w+)*)/;



	jj.render._impl = function(stack, state)
	{
		var result;
		
		// 1) loop
		if ((result = stack.t_key.match(jj.render._loop_test)) !== null) {
			jj.render._loop(result, stack, state);
		}

		// defining methods
		else if ((result = stack.t_key.match(jj.render._def_test)) !== null) {
			stack.push({
				":path": result[2]
			});
			
			state[stack.get_joined(":path")] = {
				param: result[3],
				value: stack.t_value
			}
			
			if (result[1] === "root") {
				state[":root"] = stack.t_value;
				state[":root-name"] = result[2];
			}
			
			stack.pop();
		}

		// calling methods
		else if ((result = stack.t_key.match(jj.render._call_test)) !== null) {
			//console.log("call", result[1], stack.d_key, stack.d_value);
			
			stack.push_node(state[result[1]].param, stack.d_key, stack.d_value);
			stack.get(state[result[1]].param, true).path = state[":path"];

			$.each(state[result[1]].value, function(key, value) {
				stack.push({t_key: key, t_value: value});
				jj.render._impl(stack, state);
				stack.pop();
			});

			stack.pop();
		}

		// self-element
		else if (stack.t_key === ".") {
			stack.dom_parent.text(stack.get(stack.t_value));
		}

		// 3) attribute
		else if ((result = stack.t_key.match(jj.render._attribute_test)) !== null) {
			// parse links. if it is not a link, no problem!
			var parsed_link = jj.render._parse_link(stack, stack.get(stack.t_value));
			stack.dom_parent.prop(result[1], parsed_link);
		}

		// 4) new (or cloned) child element
		else if ( (result = stack.t_key.match(jj.render._selector_test)) !== null )
		{
			//console.log(jj.render._stack_path(stack));
			//jaja.assert(result !== null, "bad key!");

			var e = jj.render._node(result, stack.dom_parent);
			
			if (typeof stack.t_value === "string") {
				e.text(stack.get(stack.t_value));
			}
			else {
				stack.push({dom_parent: e});
				$.each(stack.t_value, function(key, value) {
					stack.push({t_key: key, t_value: value});
					jj.render._impl(stack, state);
					stack.pop();
				});
				stack.pop();
			}
		}
	};

	jj.render._loop = function(regex, stack, state)
	{
		var n = stack.get(regex[2]);

		// for each x in data
		$.each(n, function(key, value)
		{
			stack.push({
				d_key: key,
				d_value: value,
			});
			stack.push_node(regex[1], key, value);
			stack.get(regex[1], true).path = state[":path"];
			state[":path"].push(key);

			// if a function is the value of the template, then we call the function once for
			// each data associated
			if (typeof stack.t_value === "function") {
				stack.t_value(stack);
			}
			// if instead it is an object, render each key
			else {
				$.each(stack.t_value, function(key, value) {
					stack.push({
						t_key: key,
						t_value: value
					});
					jj.render._impl(stack, state);
					stack.pop();
				});
			}

			state[":path"].pop();
			stack.pop();
			stack.pop();
		});
	};

	jj.render._node = function(regex, dom_parent)
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

		if (regex[1][0] == "~") {
			if (e) {
				dom_parent.find(t_key.slice(1)).replaceWith(e);
			}
			else {
				e = dom_parent.find(t_key.slice(1));
				//jaja.assert(e !== undefined, "could not find node");
			}
		}
		else {
			if (e === undefined) {
				e = $("<" + tag + (id !== undefined ? "id='" + id + "'" : "") + (classes.length > 0 ? " class='" + classes.join(" ") + "'" : "") + " />");
			}

			e.appendTo(dom_parent);
		}

		return e;
	}

	jj.render._parse_link = function(stack, data) {
		console.log("data", data);
		var result;
		if ((result = data.match(/\#{(\w+)\}/)) != null) {
			var bits = document.URL.split("/");
			console.log(bits);
			var k = stack.get(result[1], true),
			    kk = k.path
			    ;
			
			return kk.join("/");
		}

		return "giraffe!"
	}


})();

