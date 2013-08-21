if (!window.Mobile) Mobile = {};

Mobile.Overlay = new Class({
  Extends: Mobile.Component,
  
  screen_class: 'screen',
  lock: false,
  
  generate: function() {
    this.parent();

    this.screen = new Element('div', { 'class': this.screen });
    this.container.setStyles({ 
      display: 'block', 
      position: 'fixed',
      "z-index": 999999
    });
  },
  
  show: function() {
    this.generate();
    this.renderInto(Mobile.BaseLayout);
  },
  
  hide: function() {
    this.container.destroy();
	  delete this.container;
  }
});

Mobile.Overlay.create = function(name, options) {
  options = typeof(options) == 'object' ? options : {};
  if (!options["class"]) options["class"] = Mobile.Overlay;
  options.type = "overlay";
  
  Mobile.Components[name] = options;
  var loader = Mobile.Component.Loader(name);
  loadar.load();
};

