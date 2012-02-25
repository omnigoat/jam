//=====================================================================
// 
//=====================================================================

(function(undefined) {

	jam.ui.Dialog = jam.prototype({

	statics: {
		_defaults: {
			id: "",
			fixed: true,
			closer_css: "jam-ui-dialog-closer"
		},

		_currently_modal: false
	},

	protics: {

		__init__: function(options)
		{
			this._elements = {};
			this.options = $.extend({}, jam.ui.Dialog._defaults, options);
			this.options.data = options.data instanceof jQuery ? $(options.data) : options.data;

			// keep track of DOM node so in the future we can reinsert it
			if (options.data.parent()) {
				options.data.before($("<span></span>")
					.attr('id', "jam-ui-dialog-anchor")
					.addClass(this.options.id)
					.css({display: "none"})
				);

				this._original_display = options.data.css("display");
				this._anchored = true;
			}

			// clone data if we don't want mutation during use
			if (options.persist) {
				this._data = options.data;
			}
			else {
				this._data = options.data.clone(true);
				this._original_data = options.data;
			}

			// create all the elements and data and whatnot
			this.create();
		},

		create: function()
		{
			// add iframe if modal
			if (this.options.modal) {
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

			// the overlay
			this._elements.overlay = $("<div></div>")
				.addClass("jam-ui-dialog-overlay")
				.addClass(this.options.id)
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
			

			// the container positions all the actual content
			this._elements.container = $("<div></div>")
				.addClass("jam-ui-dialog-container")
				.addClass(this.options.id)
				.css({
					position: this.options.fixed ? "fixed" : "absolute",
					display: "none",
					zIndex: 9002
				})
				.appendTo("body")
			
			
			this._data.appendTo(this._elements.container);
			this.calculate_container_dimensions();
			this.bind_events();
		},

		open: function()
		{
			if (this.options.modal && jam.ui.Dialog._currently_modal) {
				console.error("jam.ui.Dialog.open: Modal dialog already open!");
				return;
			}

			this._elements.iframe && this._elements.iframe.show();
		
			if (this.options.on_open) {
				this.options.on_open(this._elements.overlay, this._elements.container, this);
			}
			else {
				this._elements.overlay.show();
				this._elements.container.show();
			}

			this.options.on_resize && this.options.on_resize(this._elements.container);
		},

		close: function()
		{
			this.unbind_events();

			if (this.options.on_close) {
				this.options.on_close(this._elements.overlay, this._elements.container, this);
			}
			else {
				this._elements.container.hide();
				this._elements.overlay.hide();
			}

			this._elements.iframe && this._elements.iframe.hide().remove();

			if (this.options.modal) {
				jam.ui.Dialog._current_modal = false;
			}

			// if we are putting our data node back into the DOM
			if (this._anchored)
			{
				var $anchor = $("span#" + this.options.id + ".jam-ui-dialog-anchor");
				// if we wish for mutations to persist, use the node we've been using all along
				if (this.options.persist) {
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


		bind_events: function()
		{
			var self = this;

			$(document).bind("keydown.jam-ui-dialog-censor", function(e) {
				e.preventDefault();
				if (self.options.close_on_esc) {
					if (self.options.on_esc_close) {
						if (self.options.on_esc_close instanceof Function) {
							self.options.on_esc_close(self._elements.container, self._elements.overlay)
						}
						else {
							self._elements.container.find(self.options.on_esc_close).trigger("click", false);
						}
					}
					self.close();
				}
			});

			this._elements.container.find("." + this.options.closer_css)
				.bind("click.jam-ui-dialog-closer", function(e) {
					e.preventDefault();
					self.close();
				});
			
			$(window).bind("resize.jam-ui-dialog-resize orientationchange.jam-ui-dialog-resize", function(e) {
				console.log("WINDOW CHANGE");
				self.recalculate_container_dimensions();
			});
		},

		unbind_events: function() {
			$(document).unbind("keydown.jam-ui-dialog-censor");
			$(window).unbind(".jam-ui-dialog-resize");
			this._elements.container.find("." + this.options.closer_css).unbind("click.jam-ui-dialog-closer");
		},


		calculate_container_dimensions: function()
		{
			var data_width = this._data.outerWidth(true),
			    data_height = this._data.outerHeight(true),
			    tominw = this.options.min_width,
			    tominh = this.options.min_height
			    tomaxw = this.options.max_width,
			    tomaxh = this.options.max_height,
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

		recalculate_container_dimensions: function() {
			this.calcualte_container_dimensions();
			this.options.on_resize && this.options.on_resize(this._elements.container);
		}

	}});


	$.extend(jam.ui, {
		msgbox: function(options)
		{
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
			if (options.buttons !== undefined)
			{
				jam.each(options.buttons, function(c, x)
				{
					var biq = $("<a>" + c + "</a>")
						.addClass(x.classes)
						.addClass("button jam-ui-dialog-closer")
						.addClass(x.behaviour === "good" ? "positive" : x.behaviour === "bad" ? "negative" : "")
						.appendTo(buttons)
						;
					
					stored_buttons[c] = biq;
					x.on_click && biq.bind("click", x.on_click);
				});
			}
			else {
				buttons.append( $("<a>Ok</a>")
					.addClass("button jam-ui-dialog-closer")
				);
			}

			var dialog = jam.ui.Dialog({
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

					$content.css({
						top: ($buttons.position().top - $title.outerHeight()) / 2 - $content.outerHeight() / 2
					});
				},

				close_on_esc: true,
				min_width: 480,
				min_height: 210
			});

			if (options.on_esc_close) {
				if (options.on_esc_close instanceof Function)
					dialog.options.on_esc_close = options.on_esc_close;
				else {
					dialog.options.on_esc_close = function() {
						stored_buttons[options.on_esc_close].trigger("click");
					};
				}
			}

			dialog.open();
		}
	});
	

})();

