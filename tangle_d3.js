/*
	Like TangleKit but for D3
	
	- Defines tangle classes for D3 SVG transforms 
	- 
*/

(function () {

Tangle.classes.T3NumberField = {

	initialize: function (element, options, tangle, variable) {
		this.input = document.createElement('input');
		this.input.setAttribute('type', 'text');
		this.input.setAttribute('class', 'TKNumberFieldInput');
		this.input.setAttribute('size', options.size || 6);
		element.insertBefore(this.input, element.firstChild);
		
		var inputChanged = (function () {
			var value = this.getValue();
			tangle.setValue(variable, value);
		}).bind(this);
		
		this.input.addEventListener("keyup",  inputChanged);
		this.input.addEventListener("blur",   inputChanged);
		this.input.addEventListener("change", inputChanged);
	},
	
	getValue: function () {
		var value = parseFloat(this.input.value);
		return isNaN(value) ? 0 : value;
	},
	
	update: function (element, value) {
		var currentValue = this.getValue();
		if (value !== currentValue) { this.input.setAttribute("value", "" + value); }
	}
};


Tangle.classes.T3DataPoint = {
	initialize: function (element, options, tangle, x_var, y_var) {
		// Construct the mapping for this point's position
		var make = function(code, name) {
			return code? new Function(name, code) : function(d) { return d; };
		}
		element.from_x = make(options['from-x'], 'x');
		element.to_x = make(options['to-x'], x_var);
		element.from_y = make(options['from-y'], 'y');
		element.to_y = make(options['to-y'], y_var);

		// Set this points drag behaviour
		var drag = d3.behavior.drag()
			.origin(Object)
			.on("drag", function(){
				var el = d3.select(this),
				    graph = element.parentNode;
				var cx = +el.attr("cx"),
				    cy = +el.attr("cy"),
				    r = +el.attr("r"),
				    w = graph.offsetWidth,
				    h = graph.offsetHeight;
				// Keep the point in the boundary
				cx = Math.max(r, Math.min(w - r, cx + d3.event.dx));
				cy = Math.max(r, Math.min(h - r, cy + d3.event.dy));
				// Transform coordinates to values 
				tangle.setValue(x_var, this.from_x(graph.domain_x.invert(cx)));
				tangle.setValue(y_var, this.from_y(graph.domain_y.invert(cy)));
			});
		d3.select(element).call(drag);
	},
	update: function (element, x_val, y_val) {
		// Transform values to coordinates, update position
		var graph = element.parentNode;
		d3.select(element)
		  .attr("cx", graph.domain_x(element.to_x(x_val)))
		  .attr("cy", graph.domain_y(element.to_y(y_val)));
	}
};
Tangle.classes.T3PlotLine = {
	initialize: function (element, options, tangle, func) {
		// Set the 3d plotter for this line
		var graph = element.parentNode;
		var [l, r] = graph.domain_x.domain();
		this.xs = d3.range(l, r, Math.abs(l-r)/100);
		this.plotter = d3.svg.line()
		  .x(function(d) { return graph.domain_x(d.x); })
		  .y(function(d) { return graph.domain_y(d.y); })
		  .interpolate("linear");
	},
	update: function (element, func) {
		// Map func over the xs points and update the line
		d3.select(element).attr("d", this.plotter(
			this.xs.map(function(x) {return {'x': x, 'y': func(x) } })
		));
	}
};

Tangle.classes.T3Graph = {
	initialize: function (element, options, tangle, variable) {
		// Set the d3 scales for this graph (value transformations)
		[t, l, b, r] = options.domain.split(" ");
		element.domain_x = d3.scale.linear()
			.domain([parseFloat(l), parseFloat(r)])
			.range([0, element.offsetWidth]);
		element.domain_y = d3.scale.linear()
			.domain([parseFloat(b), parseFloat(t)])
			.range([element.offsetHeight, 0]);
	}
};


Tangle.formats.d3format = function(value, format) {
	return d3.format(format)(value);
};
Tangle.formats.jax = function(value) {
	return d3.format('.2f')(value);
};

})();
