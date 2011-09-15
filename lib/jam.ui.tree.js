
//=====================================================================
//
//=====================================================================
(function(undefined){

	$.extend(jam.ui, {
		filetree: function($root_ul, fetch_fn) {
			$root_ul = ($root_ul instanceof $) ? $root_ul : $($root_ul);
			if ($root_ul.length === 0) { console.error("no root ul found!"); }
			return new jam.ui.filetree.init($root_ul, fetch_fn);
		}
	});

	function make_node(name, type, last_modified, commit_message) {
		return {
			name: name,
			type: type,
			loaded: false,
			last_modified: last_modified,
			commit_message: commit_message,
			children: jam.Set(function(lhs, rhs) {
				return lhs.type < rhs.type || (!(rhs.type < lhs.type) && lhs.name < rhs.name);
			})
		};
	}

	$.extend(jam.ui.filetree, {
		init: function($root_ul, fetch_fn)
		{
			$.extend(this, jam.ui.filetree, {
				// where we are currently
				location: [],
				// type: 0-folder, 1-file
				root_node: make_node("root", 0),
				// save the fetch function for later
				fetch_fn: fetch_fn,
				// hold onto the element
				$dom_node: $root_ul,
			});
			this.current_node = this.root_node;

			var self = this;

			$root_ul.find(".ui-filetree-entry").each(function() {
				
				var $this = $(this),
				    text = $.trim($this.children(".ui-filetree-name").text())
				    ;
				
				self.root_node.children[text] = {type: 0, loaded: false, children: {}};
			});

			$(".ui-filetree-entry").live("click", function() {
				var $this = $(this),
				    text = $.trim($this.children(".ui-filetree-name").text())
				    ;
				
				if (text[text.length - 1] === '/') {
					text = text.slice(0, -1);
				}

				self.cd( self.location.concat([text]) );
			});
		},

		_animate_cd: function(node)
		{
			var self = this,
			    $pane = $("<div class='ui-filetree-pane'/>"),
			    $table = $("<div class='ui-filetree-table' />").appendTo($pane);
			
			$.each(node.children, function(key, value) {
				$table.append(
					$("<div class='ui-filetree-entry' />").append(
						$("<div class='ui-filetree-name'>" + key + "</div>")
					)
				);
			});

			$pane.css({position: "absolute", left: this.$dom_node.outerWidth(), top: 0});
			this.$dom_node.parent().append($pane);

			this.$dom_node.add($pane).animate({left: "-=" + this.$dom_node.outerWidth()}, 600, function() {
				$pane.css({position: "relative", left: 0, top: 0});
				self.$dom_node = self.$dom_node.replaceWith($pane);
			});
		},


		_animate_old_pane: function(direction, fn)
		{
			direction = (direction === "rtl") ? "-=" : "+=";
			var f = direction + this.$dom_node.outerWidth();

			this.$dom_node.animate({left: f}, 600, function() {
				fn && fn();
			});
		},

		_build_new_pane: function()
		{
			var node = this.current_node,
			    $pane = $("<div class='ui-filetree-pane'/>"),
			    $table = $("<table class='ui-filetree-table' />").appendTo($pane)
			    ;
			
			/*
			node.children.sort(function(lhs, rhs) {
				if (lhs.type < rhs.type)
					return -1;
				if (lhs.type === rhs.type)
					return 0;
				return 1;
			});
			*/
			var ths = $(
				"<th class='ui-filetree-header'>Name</th>" +
			  "<th class='ui-filetree-header'>Modified</th>" +
			  "<th class='ui-filetree-header'>Commit</th>"
			).appendTo($table);
			
			console.log(node.children);
			node.children.each(function(x)
			{
				var name = (x.name + (x.type === 0 ? "/" : "")),
				    entry = $("<tr class='ui-filetree-entry' />")
				  		.append("<td class='ui-filetree-cell ui-filetree-name'>" + name + "</td>")
				  ;
				
				if (x.last_modified) {
					entry.append("<td class='ui-filetree-cell'><span>" + x.last_modified + "</span></td>");
				}

				if (x.commit_message) {
					entry.append("<td class='ui-filetree-cell'><span>" + x.commit_message + "</span></td>");
				}
				
				$table.append(entry);
			});

			this.$dom_node.parent().append($pane);
			$pane.find("td.ui-filetree-cell").each(function(i, x) {
				var $this = $(this);
				console.log($this.position().left, $this.outerWidth(), $table.innerWidth());
				if ($this.position().left + $this.outerWidth() > $table.innerWidth()) {
					console.log($this.text());
				}
			});
			return $pane;
		},

		_animate_new_pane: function(direction)
		{
			var self = this,
			    node = this.current_node,
			    $pane = this._build_new_pane()
			    ;

			// change to absolute so we don't mess things around
			$pane.css({
				position: "absolute",
				left: (direction === "rtl") ? this.$dom_node.outerWidth() : -$pane.outerWidth(),
				top: this.$dom_node.position().top
			});
			
			// animate, and afterwards, set back to relative (to take up space again)
			$pane.animate({left: 0}, 600, function() {
				$pane.css({position: "relative", left: 0, top: 0});
				self.$dom_node.replaceWith($pane);
				self.$dom_node = $pane;
			});
		},








		bind: function(eventname, fn) {
			var event_parts = eventname.split("."),
			    name = event_parts[0],
			    namespace = event_parts[1]
			    ;
			
			if (name === "cd") {
				this.$dom_node.bind("tree_" + eventname, fn);
			}
		},




		surface: function() {
			this.cd(this.location.slice(0, -1));
		},





		cd: function(location)
		{
			// new location is:   0: descendant, 1: ancestor, 2: neither, 3: initialise
			var relation;

			if ( !(location instanceof Array) ) {
				console.error("bad format for cd");
			}
			
			// compare locations
			var i = 0, ie = location.length, j = 0, je = this.location.length;
			while(i !== ie && j !== je && location[i] === this.location[j]) {
				++i, ++j;
			}

			// determine relation
			if (j === je) { relation = 0; }
			else if (i === ie) { relation = 1; }
			else { relation = 2; }
			
			// move there
			var old_node = this.current_node,
			    old_location = this.location.slice(0)
			    ;
			
			// NEW LOCATION IS: descendant
			if (relation === 0)
			{
				this._animate_old_pane("rtl");
				var remaining_path = location.splice(i, location.length - i);

				// dive down the nodes, and then animate the new pane in
				this._dive(remaining_path, old_location, function() {
					this._animate_new_pane("rtl");
				});
			}
			else {
				this._animate_old_pane("ltr");

				this.current_node = this.root_node;
				this.location = [];
				this._dive(location, old_location, function() {
					this._animate_new_pane("ltr");
				});
			}
			
		},







		_dive: function(nodes, fallback_location, callback)
		{
			if (nodes.length === 0) {
				callback.apply(this);
				return;
			}

			var child_name = nodes.shift(),
			    child = this.current_node.children.find({type: 0, name: child_name}),
			    full_path = this.location.concat([child_name])
			    ;
			
			// verify child exists
			if (child === undefined) {
				console.error("node '" + child_name + "' isn't there.");
				return false;
			}
			// verify child is correct
			else if (child.type !== 0) {
				console.error("node '" + child_name + "' isn't a directory");
				return false;
			}
			// verify child is loaded
			else if (!child.loaded) {
				var self = this;
				console.log("full path:", "/" + full_path.join("/"));
				self.fetch_fn(full_path, function(result)
				{
					// make sure we can repair a bad dive
					if (result === undefined) {
						console.error("bad diving!");
						if (fallback_location !== undefined) {
							//self._repair_dive(fallback_location, undefined);
						}
					}
					
					$.each(result, function() {
						child.children.add( make_node(this.name, this.type) );
					});

					//child.children = result;
					child.loaded = true;
					self.current_node = child;
					self.location.push(child_name);
					self.location = full_path;

					// keep going until we run out of nodes!
					self._dive(nodes, fallback_location, callback);
				});
			}
			else {
				this.current_node = child;
				this.location.push(child_name);
				this._dive(nodes, fallback_location, callback);
			}
		},


		initialise: function(location)
		{
			var self = this;
			this.fetch_fn(location, function(result) {
				if (result !== undefined) {
					console.dir(self.root_node);
					$.each(result, function() {
						self.root_node.children.add( make_node(this.name, this.type, this.last_modified, this.commit_message) );
					});
					self.root_node.loaded = true;
					self.current_node = self.root_node;
					self.location = [];
				}

				var $pane = self._build_new_pane();
				self.$dom_node.replaceWith($pane);
				self.$dom_node = $pane;
			});
		}
	});
})();









































//=====================================================================
//
//=====================================================================
(function(undefined) {
	$.extend(jam, {
		event_queue: function(options) {
			return new jam.event_queue.init(options);
		}
	});

	$.extend(jam.event_queue, {
		defaults: {
			_requires_sentinels: true
		},

		init: function(options) {
			this._options = $.extend({}, jam.event_queue.defaults, options);

			$.extend(this, jam.event_queue);
			this._queues = {};
			if (this._options._requires_sentinels) {
				this._on_finished = jam.event_queue({_requires_sentinels: false});
				this._on_starting = jam.event_queue({_requires_sentinels: false});
			}

			//this._execute = (this._options.async) ? jam.async : function(fn) {fn();};
		},

		bind: function(id, fn)
		{
			var id_parts = id.split("."),
			    event_name = id_parts.shift(),
			    event_namespace = id_parts.sort()
			    ;
			
			this._queues[event_name] = this._queues[event_name] || [];
			this._queues[event_name].push({namespace: event_namespace, fn: fn});
			return this;
		},

		unbind: function(id)
		{
			var id_parts = id.split("."),
			    event_name = id_parts.shift(),
			    event_namespace = id_parts.sort(),
			    queue = this._queues[event_name]
			    ;
			
			for (var i = 0, ie = queue.length; i != ie; ++i) {
				if (jam.subset_of(event_namespace, queue[i].namespace)) {
					queue.splice(i, 1);
					--i, --ie;
				}
			}

			return this;
		},


		trigger: function(id, options)
		{
			var id_parts = id.split("."),
			    event_name = id_parts.shift(),
			    event_namespace = id_parts.sort(),
			    queue = this._queues[event_name],
			    options = $.extend({async: false}, options),
			    executor = options.async ? jam.async : function(fn) {fn();}
			    ;
			
			if (queue === undefined) {
				console.error("queue " + event_name + " is undefined");
				return;
			} 

			executor(function() {
				// re-evaluate queue.length each time so we may add events
				for (var i = 0; i != queue.length; ++i) {
					var x = queue[i];
					if (jam.subset_of(event_namespace, x.namespace)) {
						x.fn.call(this);
					}
				}
			});

			return this;
		},
	});

})();



//=====================================================================
//
//=====================================================================
(function(undefined) {
	$.extend(jam, {
		FunctionQueue: function() {
			return new jam.FunctionQueue.init();
		}
	});

	$.extend(jam.FunctionQueue, {
		defaults: {
			auto_start: true,
		},

		init: function(options) {
			this._options = $.extend({}, jam.event_queue.defaults, options);

			$.extend(this, jam.FunctionQueue);
			this._queue = jam.event_queue();
		},

		add: function(fn) {
			this._queue.bind("", fn);
			if (this._options.auto_start) {
				this._queue.trigger("", {async: true});
			}
		},

		trigger: function() {
			this._queue.trigger("");
		}
	});

})();










