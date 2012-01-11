//=====================================================================
// 
//=====================================================================

(function(undefined) {

	jam.ui.Dialog = jam.define_class({as: {

		_elements: {},
		_defaults: {
			id: "",
			fixed: true,
			closer_css: "jam-ui-dialog-closer"
		},

		init: function(options)
		{
			this.options = $.extend({}, jam.ui.Dialog.prototype._defaults, options);
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
					self.close();
				}
			});

			this._elements.container.find("." + this.options.closer_css)
				.bind("click.jam-ui-dialog-closer", function(e) {
					e.preventDefault();
					self.close();
				});
			
			$(window).bind("resize.jam-ui-dialog-resize orientationchange.jam-ui-dialog-resize", function(e) {
				self.calculate_container_dimensions();
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
			
			console.log(data_width, data_height);
			this._elements.container.css({
				top: $(window).height() / 2 - container_width / 2,
				left: $(window).width() / 2 - container_height / 2,
				width: container_width,
				height: container_height
			});
		}

	}});

	jam.ui.Dialog._currently_modal = false;
})();