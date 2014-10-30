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

		element.domain_x = element.parentNode.domain_x.copy();
		element.domain_y = element.parentNode.domain_y.copy();
	},
	update: function (element, x_val, y_val) {
		// Transform values to coordinates, update position
		var x = element.domain_x(element.to_x(x_val)),
		    y = element.domain_y(element.to_y(y_val));
		d3.select(element)
		  .attr("transform", "translate("+x+","+y+")");
	}
};

Tangle.classes.T3BoundedDraggable = {
	initialize: function (element, options, tangle, x_var, y_var) {
		element.coolness = 'fleeting';
		// Set this points drag behaviour
		var drag = d3.behavior.drag()
			.origin(Object)
			.on("drag", function(){
				console.log('bounded', d3.event.sourceEvent.target.coolness);
				var el = d3.select(this);
				[cx, cy] = d3.transform(el.attr("transform")).translate;
				var w = element.parentNode.offsetWidth,
				    h = element.parentNode.offsetHeight;
				// Keep the point in the boundary
				cx = Math.max(0, Math.min(w, cx + d3.event.dx));
				cy = Math.max(0, Math.min(h, cy + d3.event.dy));
				// Transform coordinates to values 
				tangle.setValue(x_var, this.from_x(element.domain_x.invert(cx)));
				tangle.setValue(y_var, this.from_y(element.domain_y.invert(cy)));
			});
		d3.select(element).call(drag);
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

Tangle.classes.T3ImShow = {
	// also called 'heatmap' or '2d histogram'
	setImShow: function(img, heat) {
		var data = img.data;
		var ymax = img.height, xmax = img.width;
		for (var y = 0, p = -1; y < ymax; ++y) {
			for (var x = 0; x < xmax; ++x) {
				var c = heat(x, y); 
				data[++p] = c.r;
				data[++p] = c.g;
				data[++p] = c.b;
				data[++p] = 255;
			}
		}
		img.data = data;
	},
	initialize: function (element, options, tangle, variable) {
		
		// Set the d3 scales for this graph (value transformations)
		[t, l, b, r] = options.domain.split(" ");
		[t, l, b, r] = [parseFloat(t), parseFloat(l), parseFloat(b), parseFloat(r)];
		this.ctx = element.getContext("2d");
		this.ctx.canvas.width = Math.abs(l-r)/options.step;
		this.ctx.canvas.height = Math.abs(b-t)/options.step;

		domain_x = d3.scale.linear()
			.domain([l, r])
			.range([0, this.ctx.canvas.width]);
		domain_y = d3.scale.linear()
			.domain([b, t])
			.range([this.ctx.canvas.height, 0]);

		var color = d3.scale.linear()
		  .domain([0, .5, 1])
		  .range(["#eff3ff", "#6baed6", "#08519c"]);
		this.heat = function(mat) {
			return function(x, y) {
				return d3.rgb(color(
					mat(domain_x.invert(x),domain_y.invert(y))
				));
			}
		};
		this.imgData = this.ctx.getImageData(0,0, 
			this.ctx.canvas.width, this.ctx.canvas.width);
	},
	update: function (element, mat) {
		this.setImShow(this.imgData, this.heat(mat))
		this.ctx.putImageData(this.imgData,0,0);
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
