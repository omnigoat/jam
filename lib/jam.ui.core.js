

(function(undefined) {
	jam.ui = {};


	// get scrollbar width
	$(function() {
		var scr = null;
		var inn = null;
		var wNoScroll = 0;
		var wScroll = 0;

		// Outer scrolling div
		scr = document.createElement('div');
		scr.style.position = 'absolute';
		scr.style.top = '-1000px';
		scr.style.left = '-1000px';
		scr.style.width = '100px';
		scr.style.height = '50px';
		// Start with no scrollbar
		scr.style.overflow = 'hidden';

		// Inner content div
		inn = document.createElement('div');
		inn.style.width = '100%';
		inn.style.height = '200px';

		// Put the inner div in the scrolling div
		scr.appendChild(inn);
		// Append the scrolling div to the doc
		document.body.appendChild(scr);

		// Width of the inner div sans scrollbar
		wNoScroll = inn.offsetWidth;
		// Add the scrollbar
		scr.style.overflow = 'auto';
		// Width of the inner div width scrollbar
		wScroll = inn.offsetWidth;

		// Remove the scrolling div from the doc
		document.body.removeChild(document.body.lastChild);

		// Pixel width of the scroller
		jam.ui.scrollbar_width = wNoScroll - wScroll;
	});



	
	//=====================================================================
	// mousedown/up bindings
	//=====================================================================
	/*
	$.extend(jam.ui, {
		mousedown_position: {x: 0, y: 0},
		mouseup_position: {x: 0, y: 0}
	});
	
	$(window)
		.mousedown(function(event){
			jam.ui.mousedown_position = {x: event.pageX, y: event.pageY};
		})
		.mouseup(function(event){
			jam.ui.mouseup_position = {x: event.pageX, y: event.pageY};
		})
		;
	*/

})();

