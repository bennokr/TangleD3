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
		var make = function(code, names, default_name) {
			return new Function(names, code? code : "return " + default_name);
		}
		element.from_x = make(options['from-x'], 'x,y', 'x');
		element.to_x = make(options['to-x'], x_var+','+y_var, x_var);
		element.from_y = make(options['from-y'], 'x,y', 'y');
		element.to_y = make(options['to-y'], x_var+','+y_var, y_var);

		element.domain_x = element.parentNode.domain_x.copy();
		element.domain_y = element.parentNode.domain_y.copy();
		if (options.domain == 'relative') {
			element.relative_x = element.domain_x.copy();
			element.relative_y = element.domain_y.copy();
			rng = element.relative_x.range();
			l = rng[0]; r = rng[1];
			element.relative_x.range([l-Math.abs(l-r)/2, r-Math.abs(l-r)/2,]);
			rng = element.relative_y.range();
			t = rng[0]; b = rng[1];
			element.relative_y.range([t-Math.abs(t-b)/2, b-Math.abs(t-b)/2,]);
		}
	},
	update: function (element, x_val, y_val) {
		// Transform values to coordinates, update position
		var x = element.domain_x(element.to_x(x_val, y_val)),
		    y = element.domain_y(element.to_y(x_val, y_val));
		d3.select(element)
		  .attr("transform", "translate("+x+","+y+")");
	}
};

Tangle.classes.T3BoundedDraggable = {
	initialize: function (element, options, tangle, x_var, y_var) {
		// Set this points drag behaviour
		var drag = d3.behavior.drag()
			.origin(Object)
			.on("drag", function(){
				var el = d3.select(this);
				cs = d3.transform(el.attr("transform")).translate;
				cx = cs[0]; cy = cs[1];
				var w = element.parentNode.offsetWidth,
				    h = element.parentNode.offsetHeight;
				// Keep the point in the boundary
				cx = Math.max(0, Math.min(w, cx + d3.event.dx));
				cy = Math.max(0, Math.min(h, cy + d3.event.dy));
				// Transform coordinates to values
				cx = element.domain_x.invert(cx);
				cy = element.domain_y.invert(cy);
				tangle.setValue(x_var, this.from_x(cx,cy));
				tangle.setValue(y_var, this.from_y(cx,cy));
			});
		d3.select(element).call(drag);
	}
};

Tangle.classes.T3Vector = {
	initialize: function (element, options, tangle, x_var, y_var, px_var, py_var) {
		console.log(px_var, py_var);
		this.head = d3.select(element).append("svg:polygon")
		    .attr("points", "0,0, -10,20, 10,20")
		    .call(d3.behavior.drag()
				.on("drag", function(d,i) {
					var el = d3.select(this);
					cs = d3.transform(el.attr("transform")).translate;
				    cx = cs[0]; cy = cs[1];
				    cx += d3.event.dx;
				    cy += d3.event.dy;
				    cx = element.relative_x.invert(cx);
					cy = element.relative_y.invert(cy);
					tangle.setValue(px_var, element.from_x(cx, cy));
					tangle.setValue(py_var, element.from_y(cx, cy));

				})
			);
		this.line = d3.select(element).append("line");
	},
	update: function (element, x, y, px, py) {
		px = element.relative_x(element.to_x(px, py));
		py = element.relative_y(element.to_y(px, py));
		angle = 90+ Math.atan2(py - y, px - x) * 180 / Math.PI;
		this.head.attr("transform", 
			"translate(" + [ px,py ] + ") rotate("+angle+")"
		);
		this.line
			.attr("x2", px)
			.attr("y2", py);
	}
};

Tangle.classes.T3PlotLine = {
	initialize: function (element, options, tangle, func) {
		// Set the 3d plotter for this line
		var graph = element.parentNode;
		dom = graph.domain_x.domain();
		l = dom[0]; r = dom[1];
		this.xs = d3.range(l, r, Math.abs(l-r)/100);
		this.plotter = d3.svg.line()
		  .x(function(d) { return graph.domain_x(d.x); })
		  .y(function(d) { return graph.domain_y(d.y); })
		  .interpolate("linear");
		var dom = graph.domain_y.domain();
		this.bound_inf = function(y) {
			if (y == Number.POSITIVE_INFINITY) {
				return dom[1];
			}
			if (y == Number.NEGATIVE_INFINITY) {
				return dom[0];
			}
			if (isNaN(y)) {
				return 0;
			}
			return y;
		}
	},
	update: function (element, func) {
		// Map func over the xs points and update the line
		var bound_inf = this.bound_inf;
		d3.select(element).attr("d", this.plotter(
			this.xs.map(function(x) {return {'x': x, 'y': bound_inf(func(x)) } })
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
		dom = options.domain.split(" ");
		t=dom[0]; l=dom[1]; b=dom[2]; r=dom[3];
		t = parseFloat(t);
		l = parseFloat(l);
		b = parseFloat(b);
		r = parseFloat(r);
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
		dom = options.domain.split(" ");
		t=dom[0]; l=dom[1]; b=dom[2]; r=dom[3];
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
