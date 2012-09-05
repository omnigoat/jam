//=====================================================================
//
//
//
//
//=====================================================================
(function(undefined){

	//=====================================================================
	// prototype for a single tab
	//=====================================================================
	// var tab_prototype = {
	// 	bind: function(eventname, f)
	// 	{
	// 		var $dom = $(this.iq),
	// 		    event_parts = eventname.split("."),
	// 		    name = event_parts[0],
	// 		    namespace = event_parts[1]
	// 		    ;
			
	// 		if (namespace !== undefined)
	// 			namespace = "." + namespace;
	// 		else
	// 			namespace = "";

	// 		if (name === "select") {
	// 			$dom.bind("mousedown" + namespace, f);
	// 		}
	// 		else if (name === "close") {
	// 			$dom.find(".ui-tab-close-circle2").bind("mousedown" + namespace, f);
	// 		}
	// 		else {
	// 			$dom.bind("tab_" + eventname, f);
	// 		}
	// 	}
	// };


	jam.ui.TabGroup = jam.prototype({

		constructor: function($container, $tabs, options)
		{
			// jQuerify $container
			$container = $container instanceof jQuery ? $container : $($container);

			if (arguments.length == 1) {
				$tabs = $container.children();
			}
			else if (arguments.length == 2) {
				if ($tabs instanceof jQuery || typeof $tabs == "string") {
					$tabs = $tabs instanceof jQuery ? $tabs : $($tabs);
				}
				else {
					options = $tabs;
					$tabs = $container.children();
				}
			}
			else {
				$tabs = $tabs instanceof jQuery ? $tabs : $($tabs);
			}


			this.define_members({
				_settings: jam.extend({}, jam.ui.TabGroup.defaults, options),
				$container: $container,
				$tabs: $tabs,
				_tab_size: null
			});


			//---------------------------------------------------------
			// style tabs
			//---------------------------------------------------------
			// add classes
			this.$container.addClass("ui-tabs");
			this.$tabs
				.addClass("ui-tab-wrapper")
				.filter(".default")
					.removeClass("default")
					.addClass("ui-active")
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

			this._bind_events();
			this._resize();

			if (this._settings.activate_default) {
				this.$tabs.filter(".ui-active").trigger("mousedown");
			}
		},

		methods: {
			link_to_panes: function($panes) {
				$panes = ($panes instanceof $) ? $panes : $($panes);

				jam.assert(
					this.$tabs.length === $panes.length,
					"jam.ui.tabs: Incorrect number of tabs/panes"
				);
				

				// add classes
				$panes.addClass("ui-pane");

				jam.each(this.$tabs, function($tab, i) {
					$tab = $($tab);
					var $pane = $($panes[i]);

					if ($tab.hasClass("ui-active")) {
						$pane.addClass("ui-active");
					}

					$tab.bind("mousedown", function() {
						$panes.removeClass("ui-active");
						$pane.addClass("ui-active");
					});
				});
			},

			_bind_events: function() {
				var self = this;

				this.$tabs.bind("mousedown", function(event)
				{
					// reset previous active tab
					self.$tabs.filter(".ui-active")
						.removeClass("ui-active")
						.css("z-index", self._activetab_old_zindex)
						.trigger("tab_deselect")
						;

					// activate new tab
					$(this).addClass("ui-active");
					self._activetab_old_zindex = this.style.zIndex;
					this.style.zIndex = self.$tabs.length;
					event.preventDefault();
					$(this).trigger("tab_select");
				});
			},


			_resize: function()
			{
				this.$container.css({
					height: this.$tabs.outerHeight()
				});

				this.$tabs.css({
					width: (100 / this.$tabs.length) + "%",
					top: 0
				});

				this._tab_size = this.$tabs.outerWidth();

				this.$tabs.each(function(i, x) {
					$(this).css("left", i * $(this).outerWidth());
				});
			}
		},

		statics: {
			defaults: {
				activate_default: true
			}
		}
	});


	//=====================================================================
	// tabs function
	//=====================================================================
	jam.extend(jam.ui, {
		tabs: function(a1, a2, a3)	{
			return jam.ui.TabGroup.apply({}, arguments);
		}
	});

})();
