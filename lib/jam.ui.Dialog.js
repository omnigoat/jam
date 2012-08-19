//=====================================================================
// 
//  jam.ui: Dialog
//  ================
//    @persist
//    ----------
//      If true, doesn't modify the data node inbetween
//      multiple calls to open(). If false, creates a clone of the data
//      node, and uses a "fresh" clone for each call, allowing users
//      not to worry about resetting content between calls.
//=====================================================================
(function(undefined) {
jam.ui.Dialog = jam.prototype({

	statics: {
		defaults: {
			fixed: true,
			closer_css: "jam-ui-dialog-closer"
		},

		_currently_modal: false
	},

	constructor: function(options)
	{
		jam.assert(options.id, "jam.ui.Dialog: Dialogs REQUIRE an unique id per dialog");

		//=====================================================================
		// set up members
		//=====================================================================
		// make sure the data node is jQueried
		options.data = options.data instanceof jQuery ? options.data : $(options.data);

		this.define_members({
			_elements: {},
			_options: jam.extend({}, jam.ui.Dialog.defaults, options),

			// clone the data if options.persist is false
			_data: options.persist ? options.data : options.data.clone(true),

			// we need the original data for future cloning if options.persist
			_original_data: options.persist ? null : options.data,

			_dialog_guid: "jam-ui-dialog-" + options.id
		});
		
		// keep track of DOM node so in the future we can reinsert it
		if (options.data.parent()) {
			options.data.before($("<span></span>")
				.attr('id', "jam-ui-dialog-anchor")
				.addClass(this._options.id)
				.css({display: "none"})
			);

			this.define_members({
				_original_display: options.data.css("display"),
				_anchored: true
			})
		}

		//=====================================================================
		// create all the elements and data and whatnot
		//=====================================================================
		if (this._options.modal) {
			this._elements.iframe = $("<iframe src='javascript:false;'></iframe>")
				.css({
					display: "none",
					position: "fixed",
					width: $(window).width(),
					height: $(window).height(),
					opacity: 0,
					zIndex: 9000,
					top: 0,
					left: 0
				})
				.appendTo("body");
		}

		this._elements.overlay = $("<div></div>")
			.addClass("jam-ui-dialog-overlay")
			.addClass(this._options.id)
			.css({
				position: "fixed",
				left: 0,
				top: 0,
				width: $(document).width(),
				height: $(document).height(),
				display: "none",
				zIndex: 9001 // that's over 9000!
			})
			.appendTo("body");
		
		this._elements.container = $("<div></div>")
			.addClass("jam-ui-dialog-container")
			.addClass(this._options.id)
			.css({
				position: this._options.fixed ? "fixed" : "absolute",
				display: "none",
				zIndex: 9002
			})
			.appendTo("body");
		
		this._data.appendTo(this._elements.container);
		//this._calculate_container_dimensions();
	},






	methods: {
		open: function()
		{
			if (!this._options.persist) {
				this._data.remove();
				this._data = this._original_data.clone(true);
				this._data.appendTo(this._elements.container);
			}

			this._bind_events();

			if (this._options.modal && jam.ui.Dialog._currently_modal) {
				console.error("jam.ui.Dialog.open: Modal dialog already open!");
				return;
			}

			this._elements.iframe && this._elements.iframe.show();
		
			if (this._options.on_open) {
				this._options.on_open(this._elements.overlay, this._elements.container, this);
			}
			else {
				this._elements.overlay.show();
				this._elements.container.show();
			}

			// we NEED to calculate the dimensions *after* showing the elements (even if
			// they're performing an animation), so that we get correct values
			this._recalculate_container_dimensions();
			this._options.on_resize && this._options.on_resize(this._elements.container);
		},

		close: function()
		{
			this._unbind_events();

			if (this._options.on_close) {
				this._options.on_close(this._elements.overlay, this._elements.container, this);
			}
			else {
				this._elements.container.hide();
				this._elements.overlay.hide();
			}

			this._elements.iframe && this._elements.iframe.hide().remove();

			if (this._options.modal) {
				jam.ui.Dialog._current_modal = false;
			}

			// if we are putting our data node back into the DOM
			if (this._anchored)
			{
				var $anchor = $("span#" + this._options.id + ".jam-ui-dialog-anchor");
				// if we wish for mutations to persist, use the node we've been using all along
				if (this._options.persist) {
					$anchor.replaceWith(this._data.css({display: this._original_display}));
				}
				// else, use the node we cloned from
				else {
					var self = this;
					this._data.promise().done(function() {
						self._data.remove();
						$anchor.replaceWith(this._original_data);
					});
				}
			}
		},


		_bind_events: function()
		{
			var self = this;

			$(document).bind("keydown.jam-ui-dialog-censor", function(e) {
				e.preventDefault();
				if (self._options.close_on_esc) {
					if (self._options.on_esc_close) {
						if (self._options.on_esc_close instanceof Function) {
							self._options.on_esc_close(self._elements.container, self._elements.overlay)
						}
						else {
							self._elements.container.find(self._options.on_esc_close).trigger("click", false);
						}
					}
					self.close();
				}
			});

			this._elements.container.find("." + this._options.closer_css)
				.bind("click.jam-ui-dialog-closer", function(e) {
					e.preventDefault();
					self.close();
				});
			
			$(window).bind(
				" resize." + this._dialog_guid,
				" orientationchange." + this._dialog_guid,
				jam.bind(this._recalculate_container_dimensions, this)
			);
		},


		_unbind_events: function() {
			$(document).unbind("keydown.jam-ui-dialog-censor");
			$(window).unbind("." + this._dialog_guid);
			this._elements.container.find("." + this._options.closer_css).unbind("click.jam-ui-dialog-closer");
		},


		_calculate_container_dimensions: function()
		{
			var data_width = this._data.outerWidth(true),
			    data_height = this._data.outerHeight(true),
			    tominw = this._options.min_width,
			    tominh = this._options.min_height
			    tomaxw = this._options.max_width,
			    tomaxh = this._options.max_height,
			    min_container_width = (tominw && data_width < tominw) ? tominw : data_width,
			    min_container_height = (tominh && data_height < tominh) ? tominh : data_height
			    container_width = (tomaxw && min_container_width > tomaxw) ? tomaxw : min_container_width,
			    container_height = (tomaxh && min_container_height > tomaxh) ? tomaxh : min_container_height
			    ;
			
			this._elements.container.css({
				top: $(window).height() / 2 - container_height / 2,
				left: $(window).width() / 2 - container_width / 2,
				width: container_width,
				height: container_height
			});
		},


		_recalculate_container_dimensions: function() {
			this._calculate_container_dimensions();
			this._options.on_resize && this._options.on_resize(this._elements.container);
		}

	}
});


jam.extend(jam.ui, {
	msgbox: function(options)
	{
		options = jam.extend({immediate: true}, options);

		var whole = $("<div></div>")
		    	.addClass("jam-ui-msgbox wrapper"),
		    title = $("<div></div>")
		    	.addClass("title")
		    	.append(options.title)
		    	.appendTo(whole),
		    content = $("<div></div>")
		    	.addClass("content")
		    	.append(options.message)
		    	.appendTo(whole),
		    buttons = $("<div></div>")
		    	.addClass("buttons")
		    	.appendTo(whole)
		    ;
		
		var stored_buttons = {};
		if (options.buttons === undefined) {
			options.buttons = {
				"Ok": {}
			};
		}

		jam.each_in_object(options.buttons, function(v, k) {
			var biq = $("<a>" + k + "</a>")
				.addClass(v.classes)
				.addClass("button jam-ui-dialog-closer")
				.addClass(v.behaviour === "good" ? "positive" : v.behaviour === "bad" ? "negative" : "")
				.appendTo(buttons)
				;

			if (v.on_click)
				biq.click(v.on_click);

			stored_buttons[k] = biq;
		});
			
		var dialog = jam.ui.Dialog(jam.extend({
			id: "jam-ui-msgbox",
			data: whole,
			
			on_open: function(container, overlay) {
				container.fadeIn();
				overlay.fadeIn();
			},

			on_resize: function($container) {
				var $title   = $container.find(".jam-ui-msgbox .title"),
				    $content = $container.find(".jam-ui-msgbox .content"),
				    $buttons = $container.find(".jam-ui-msgbox .buttons")
				    ;
			},

			close_on_esc: true,
			min_width: 480,
			min_height: 210
		}, options));


		if (options.on_esc_close) {
			if (options.on_esc_close instanceof Function)
				dialog._options.on_esc_close = options.on_esc_close;
			else {
				dialog._options.on_esc_close = function() {
					stored_buttons[options.on_esc_close].trigger("click");
				};
			}
		}

		if (options.immediate)
			dialog.open();

		return dialog;
	}
});


})();

