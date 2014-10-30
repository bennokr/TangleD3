/*
	MathJax class transformations for Tangle.js
	
	- Adds a simple tangle macro
	- Converts all "x:y" css classes to "x=y" html attributes 
	- Makes the symbols substitute their tangle values on mouseover
*/
MathJax.Hub.Config({
  showMathMenu: false,
  TeX: {
    Macros: {
      tangle: ['\\class{thover}{\\class{tvar data-var:#1 data-format:jax}{}\\class{tsym}{#2}}',2]
    }
  }
});

MathJax.Hub.Register.StartupHook("End Typeset",function () {
	// Transform the tangle variables classes to attributes
	var formulas = document.getElementsByClassName('MathJax_Display');
	for (var i = 0; i<formulas.length; i++) {
		var fields = formulas[i].getElementsByClassName('tvar');
		for (var j = 0; j < fields.length; j++) {
			classList = [].slice.call(fields[j].classList);
			for (var k = 0; k < classList.length; k++) {
				// Just add the data-x classes as attributes
				var m = classList[k].match("data-(.+):(.+)");
				if (m != null) {
					fields[j].classList.remove(m[0]);
					fields[j].setAttribute('data-'+m[1], m[2]);
				}
			}
		}
	}
});

(function () {

Tangle.classes.tvar = {
	initialize: function (element, options, tangle, variable) {
		// Resize the value element to fit snugly
		var sym = element.parentNode.getElementsByClassName('tsym')[0];
		element.style.width = sym.offsetWidth+'px';
		element.style.height = sym.offsetHeight+'px';
		element.style.position = "absolute";
		element.style.textAlign = "center";
		element.style.fontFamily = "STIXGeneral-Regular";
		element.parentNode.style.display = "inline-block";

		// Switch the value / symbol visibility on mouseover
		element.style.visibility = 'hidden';
		tangle.element.addEventListener("mouseenter", function() {
			element.style.visibility = 'visible';
			sym.style.visibility = 'hidden';
		}, false);
		tangle.element.addEventListener("mouseleave", function() {
			element.style.visibility = 'hidden';
			sym.style.visibility = 'visible';
		}, false);
        
	}
}

})();