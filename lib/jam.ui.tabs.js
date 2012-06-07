//=====================================================================
//
//
//
//
//=====================================================================
(function(undefined){

	//=====================================================================
	// prototype for the tabs widget
	//=====================================================================
	var tabs_widget_prototype =
	{
		defaults: {
			max_tab_width_pc: 20,
			max_tab_width_px: 80,
			close_button: true,
			draggable: true
		},

		

		to_panes: function($panes) {
			$panes = ($panes instanceof $) ? $panes : $($panes);
			if (this.$tabs.length !== $panes.length) {
				console.error("mismatch tabs/panes");
			}

			// add classes
			$panes.addClass("ui-pane");

			this.links = jam.zip(this.$tabs, $panes);
			var $tabs = this.$tabs;

			$.each(this.links, function()
			{
				var $tab = $(this[0]),
				    $pane = $(this[1])
				    ;
				
				if ($tab.hasClass("ui-tab-active")) {
					$pane.addClass("ui-pane-active");
				}

				$tab.bind("mousedown", function() {
					$panes.removeClass("ui-pane-active");
					$pane.addClass("ui-pane-active");
				});
			});
		}
	};

	//=====================================================================
	// prototype for a single tab
	//=====================================================================
	var tab_prototype = {
		bind: function(eventname, f)
		{
			var $dom = $(this.iq),
			    event_parts = eventname.split("."),
			    name = event_parts[0],
			    namespace = event_parts[1]
			    ;
			
			if (namespace !== undefined)
				namespace = "." + namespace;
			else
				namespace = "";

			if (name === "select") {
				$dom.bind("mousedown" + namespace, f);
			}
			else if (name === "close") {
				$dom.find(".ui-tab-close-circle2").bind("mousedown" + namespace, f);
			}
			else {
				$dom.bind("tab_" + eventname, f);
			}
		}
	};




	//=====================================================================
	// tabs function
	//=====================================================================
	$.extend(jam.ui, {
		tabs: function(elem, options)	{
			return new jam.ui.tabs.init(elem, options || {});
		}
	});

	$.extend(jam.ui.tabs, {
		init: function(elem, options)
		{
			// initialise instance
			$.extend(this, jam.ui.tabs, tabs_widget_prototype);

			// settings
			this._settings = $.extend({}, tabs_widget_prototype.defaults, options);
			this.$bar = (elem instanceof $) ? elem : $(elem);
			// the group of tabs themselves
			this.$tabs = this.$bar.children();


			//---------------------------------------------------------
			// style tabs
			//---------------------------------------------------------
			// add classes
			this.$bar.addClass("ui-tabs");
			this.$tabs
				.addClass("ui-tab-wrapper")
				.filter(".default")
					.removeClass("default")
					.addClass("ui-tab-active")
				;
			
			// wrap content of li in packaging
			this.$tabs.wrapInner(
				"<div class='ui-tab'>" +
					"<div class='ui-tab-inner'>" +
						"<div class='ui-tab-inner2'>" +
							"<div class='ui-tab-content'>" +
								"<div class='ui-tab-content-label'>" +
								"</div>" +
							"</div>" +
						"</div>" +
					"</div>" +
				"</div>"
			);


			if (this._settings.draggable) {
				this.$tabs.draggable({axis: 'x', containment: 'parent', distance: 10});
			}


			// resize
			this._resize();


			//---------------------------------------------------------
			// structure tabs
			//---------------------------------------------------------
			var widget = this;

			// set of tabs; predicate is physical position on window
			this.tabs_set = jam.Set(function(lhs, rhs) {
				return $(lhs).position().left < $(rhs).position().left;
			});
			this.tabs_set.insert_all(this.$tabs.get());
			
			// the tabs as topology: their logical locations. we require
			// this so that we don't continually swap tabs that are being
			// physically moved to their logical spots
			this.tabs_topology = [];
			this.$tabs.each(function(i) {
				widget.tabs_topology[this] = {index: i, animating: false};
				widget.tabs_topology[i] = this;
				$(this).css("z-index", (widget.$tabs.length - i - 1));
			});


			//---------------------------------------------------------
			// behavioural modification
			//---------------------------------------------------------
			//
			// MOUSEDOWN
			//
			this.$tabs.bind("mousedown", function(event)
			{
				// reset previous active tab
				widget.$tabs.filter(".ui-active")
					.removeClass("ui-active")
					.css("z-index", widget.activetab_old_zindex)
					.trigger("tab_deselect")
					;

				// activate new tab
				$(this).addClass("ui-active");
				widget.activetab_old_zindex = this.style.zIndex;
				this.style.zIndex = 9001;
				event.preventDefault();
			})
			//
			// START DRAGGING
			//
			.bind("dragstart", function()
			{
			})
			//
			// WHILST DRAGGING
			//
			.bind("drag", jam.curry(this._drag, widget))
			//
			// STOP DRAGGING
			//
			.bind("dragstop", jam.curry(this._drag_stop, widget))
			;



			//
			// close button
			//
			if (this._settings.close_button)
			{
				this.$tabs.find(".ui-tab-inner").append(
					"<div class='ui-tab-close'>" +
						"<div class='ui-tab-close2'>" +
							"<div class='ui-tab-close-circle'>" +
								"<div class='ui-tab-close-circle2'>" +
									"x" +
								"</div>" +
							"</div>" +
						"</div>" +
					"</div>"
				);

				this.$tabs.find("div.ui-tab-close-circle2")
					.bind("mouseenter", function() {
						$(this).addClass("ui-active");
						$(this).find("span").addClass("ui-active");
					})
					.bind("mouseleave", function() {
						$(this).removeClass("ui-active");
						$(this).find("span").removeClass("ui-active");
					})
					.bind("mousedown", function(event) {
						event.stopPropagation();
						event.preventDefault();

						// remove tab

						widget.tabs_set.sort();
						var $dom = $(this).parents(".ui-tab"),
						    dom = $dom[0]
						    index = widget.tabs_set.index_of(dom),
						    $dom_followers = $dom.nextAll()
						    ;
						
						$dom_followers.each(function() {
							var $tab = $dom_follower = $(this);
							$dom_follower.css("left", parseInt($dom_follower.css("left")) + $dom_follower.outerWidth());
						});

						for (var i = index + 1, ie = widget.tabs_set.length; i != ie; ++i) {
							var $tab = $(widget.tabs_set[i]);
							$tab.animate({left: parseInt($tab.css("left")) - $tab.outerWidth() });
						}

						$dom.animate({width: "toggle"}, 200, function() {
							$dom.remove();
							widget.tabs_set.remove(index);
							widget.tabs_topology.remove(index);
						});
					})
					;
			}
		
			
			this.$tabs.filter(".ui-tab-active").trigger("mousedown");




			// return the widget
			return this;
		},


		//=====================================================================
		// TAB
		//=====================================================================
		tab: function(id) {
			var tab = undefined;
			if (typeof id === "string") {
				tab = this.$tabs.find("div.ui-tab-inner").filter(":has(div.ui-tab-content-label:contains(" + id + "))");
			}
			else {
				tab = this.$tabs.get(id);
			}

			return $.extend({iq: tab}, tab_prototype);
		},

		//=====================================================================
		//
		//=====================================================================
		_resize: function() {
			
			this.$bar.css({
				height: this.$tabs.outerHeight()
			});

			this.$tabs.css({
				width: (100 / this.$tabs.length) + "%",
				top: 0
			});

			this.tab_size = this.$tabs.outerWidth();

			this.$tabs.each(function(i, x) {
				console.log(i);
				$(this).css("left", i * $(this).outerWidth());
			});

		},


		//=====================================================================
		// PREV
		//=====================================================================
		_drag: function(widget)
		{
			//console.log(widget);
			widget.tabs_set.sort();

			//console.log("-----------");
			//jam.each(widget.tabs_set, function(x) {
			//	console.log($(x).position().left);
			//});

			var drag_tab = this,
					$drag_tab = $(drag_tab),
			    drag_index = widget.tabs_set.index_of(drag_tab),
			    prev_index = drag_index - 1,
			    prev_tab = widget.tabs_set[prev_index],
			    $prev_tab = $(prev_tab),
			    prev_topo = widget.tabs_topology[prev_index],
			    next_index = drag_index + 1,
			    next_tab = widget.tabs_set[next_index],
			    $next_tab = $(next_tab),
			    next_topo = widget.tabs_topology[next_index]
			    ;
			
			jam.assert(drag_index !== undefined, "bad index! " + $drag_tab.position().left);

			// if we have a previous tab, and the previous tab is not us (which
			// would mean we've already started animated the previous tab, and
			// switched them around in the topology accordingly)
			if (prev_tab && prev_topo.tab != drag_tab && !prev_topo.animating && 
				$drag_tab.position().left < prev_index * widget.tab_size + widget.tab_size * 0.33)
			{
				console.log("here we go: " + ($prev_tab.position().left + $drag_tab.outerWidth()));

				$prev_tab.stop();
				prev_topo.animating = true;
				$prev_tab.animate({
					left: drag_index * $drag_tab.outerWidth()
				}, 300, function() {
					prev_topo.animating = false;
					widget.tabs_topology.swap(prev_index, drag_index);
				});

				// swap z-indices around
				widget.activetab_old_zindex = $prev_tab.css("z-index");
				$prev_tab.css("z-index", widget.activetab_old_zindex);
			}
			else if (next_tab && next_topo.tab != drag_tab && !next_topo.animating &&
				$drag_tab.position().left + widget.tab_size > next_index * widget.tab_size + widget.tab_size * 0.66)
			{
				console.log("here we go NEXT: " + ($next_tab.position().left + $drag_tab.outerWidth()));

				
				$next_tab.stop();
				next_topo.animating = true;
				$next_tab.animate({
					left: drag_index * $drag_tab.outerWidth()
				}, 300, function() {
					next_topo.animating = false;
					widget.tabs_topology.swap(next_index, drag_index);
				});

				// swap z-indices around
				widget.activetab_old_zindex = $next_tab.css("z-index");
				$next_tab.css("z-index", widget.activetab_old_zindex);
			}
		},

		_drag_stop: function(widget)
		{
			widget.tabs_set.sort();
			var drag_tab = this,
			    $drag_tab = $(drag_tab),
			    drag_tab_index = widget.tabs_topology[drag_tab].index
			    ;

			console.log(drag_tab_index);
			
			// snap active tab back into place
			$drag_tab.stop().animate({
				left: drag_tab_index * widget.tab_size
			}, 100);
		}
	});

})();
