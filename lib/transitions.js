if (!window.Mobile) Mobile = {};

Mobile.Transitions = {};

Mobile.Transitions.Plain = {
  duration: 0,
  out: {
    animateTo: {
      display: "none"
	}
  },
  
  "in": {
    start: {
	  position: "absolute",
	  left: "0px",
	  top: "0px",
	  display: "inline-block"
	},
    animateTo: {
      display: "block"
	},
	finish: {
	  position: "relative",
	  display: "block"
	}
  },
  
  reverse: "Plain"
};

Mobile.Transitions.SlideLeft = {
  duration: 0.75,

  out: {
    animateTo: {
      left: "-%WIDTH%px"
	}
  },

  "in": {
	start: {
	  left: "%WIDTH%px",
	  position: "absolute",
	  top: "0px"
	},
    animateTo: {
	  left: "0px"
	},
	finish: {
	  position: "relative"
	}
  },
  
  reverse: "SlideRight"
};

Mobile.Transitions.SlideRight = {
  duration: 0.75,
  out: {
	animateTo: {
      left: "%WIDTH%px"
	}
  },
  
  "in": {
    start: {
      left: "-%WIDTH%px",
	  position: "absolute",
	  top: "0px"
	},
	animateTo: {
      left: "0px"
	},
	
	finish: {
	  position: "relative"
	}
  },
  
  reverse: "SlideLeft"
}

Mobile.SwapComponents = {
  
  start: function(current, next, into) {
    var options = this.options = this.setDefaultOptions(arguments[3]);
	
	if (!options.measurements) {
      var sizes = into.getSize(), pos = into.getPosition();
	  options.measurements = {};
	  options.measurements.width 	= sizes.x;
	  options.measurements.height = sizes.y;
	  options.measurements.top 	= pos.y;
	  options.measurements.left 	= pos.x;
	  options.measurements.bottom = pos.y + sizes.y;
	  options.measurements.right  = pos.x + sizes.x;
	}
	
    if (current && options.transition.out.start)
      current.setStyles( this.translateCss(options.transition.out.start, options.measurements));
    if (next && options.transition["in"].start)
      next.setStyles( this.translateCss(options.transition["in"].start, options.measurements));
    
    var transitionDuration = {
      '-o-transition': 'all ' + options.transition.duration + 's',
      '-moz-transition': 'all ' + options.transition.duration + 's',
      '-webkit-transition': 'all ' + options.transition.duration + 's',
      transition: 'all ' + options.transition.duration + 's'};
    
	if (current)
	  current.setStyles(transitionDuration);
    if (next)
	  next.setStyles(transitionDuration);
    
	if (next)
      into.grab(next);
    
	(function() {
		if (current && options.transition.out.animateTo)
		  current.setStyles( this.translateCss(options.transition.out.animateTo, options.measurements));
		if (next && options.transition["in"].animateTo)
		  next.setStyles( this.translateCss(options.transition["in"].animateTo, options.measurements));
		
		this.cleanup.delay(options.transition.duration * 1000, this, [current, next]);
	}).delay(5, this);
  },

  cleanup: function(former, current) {
    if (former)
	  former.dispose();
	if (current && this.options.transition["in"].finish)
	  current.setStyles(this.options.transition["in"].finish);
  },
  
  setDefaultOptions: function(options) {
    if (!typeof(options) == "object") options = {}
	
	if (options.transition)
	  options.transition = typeof(options.transition) == 'object' ? options.transition : Mobile.Transitions[options.transition]
	if (!options.transition)
      options.transition = Mobile.Transitions.Plain;
    return options;
  },
  
  translateCss: function(cssObject, measurements) {
    for (var i in cssObject) if (cssObject.hasOwnProperty(i)) {
      for ( var j in measurements) if (measurements.hasOwnProperty(j)) {
        var symbol = "%" + j.toUpperCase() + "%";
        cssObject[i] = cssObject[i].replace(symbol, measurements[j]);
      }
    }
	
    return cssObject;
  }
};