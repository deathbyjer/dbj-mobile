if (!window.Mobile) Mobile = {};

Mobile.Overlay = new Class({
  Extends: Mobile.Component,
  
  lock_screen: false,
  screen_class: 'dark-screen',
  
  initialize: function() {
    this.layout = Mobile.Overlay.Screen;
  },  
  
  generate: function() {
    this.parent();
    this.container.setStyles({
      display: 'inline-block',
      margin: '0px auto'
    });
  },
  
  isOpen: function() {
    return this.container ? true : false;
  },
  
  show: function() {
    this.generate();
    Mobile.Overlay.Screen.show({ screen_class: this.screen_class });
    Mobile.Overlay.Screen.replaceComponent(this);
  },
  
  addEvent: function(type, func) {
    if (type == 'screenDestroyed') {
      Mobile.Overlay.Screen.addEvent('destroyed', func);
    } else
      this.parent(type, func);
  },
  
  destroy: function() {
    if (!this.built) return;
    
    this.container.destroy();
	  delete this.container;
    
    if (this.layout.content == this || !this.layout.content) {
      delete this.layout.content;
      this.layout.destroy();
    }
    
    this.parent(true);
  }
});

Mobile.Overlay.Screen = new new Class({
  Extends: Mobile.Layout,
  
  default_transition: Mobile.Transitions.FittedPlain,
  
  content: false,
  
  generate: function() {
    this.screen = new Element('div', { 
      'class': 'overlay-screen'
    });
    this.screen.addEvent('click', this.clickScreen.bind(this));
    
    this.container = new Element('div', {
      'class': 'overlay-container'
    });
    
    this.frame = new Element('div', {
      'class': 'mobile-frame overlay-frame'
    });
    
    this.frame.addEvent('click', this.clickScreen.bind(this));
    
    this.container.grab(this.screen);
    this.container.grab(this.frame);
    this.parent();
  },
  
  getContainer: function() {
    if (!this.container) this.generate();
    return this.container;
  },
  
  getScreen: function() {
    if (!this.screen) this.generate();
    return this.screen;
  },
  
  setScreenClass: function(screen_class) {
    if (this.screen_class)
      this.getScreen().removeClass(this.screen_class);
    this.screen_class = screen_class;
    
    this.getScreen().addClass(this.screen_class);
  },
  
  show: function(options) {
    if (!this.container) this.generate();
    
    options = typeof(options) == 'object' ? options : {}
    
    if (options.screen_class)
      this.setScreenClass(options.screen_class);
      
    Mobile.BaseLayout.getComponentContainer().grab(this.getContainer());
  },
  
  clickScreen: function() {
    if (this.content.lock_screen) return;
    this.destroy();
  },
  
  clickComponent: function(evt) {
    evt.stopPropagation();
  },
  
  setSize: function(evt) {
    this.container.setStyle('width', this.container.getSize().x);
  },
  
  replaceComponent: function(component) {
  //  var resizeFrame = this.resizeFrame.bind(this)
    this.show();
    this.content = component;
    component.container.addClass('popup-component');
    component.container.addEvent('click', this.clickComponent.bind(this));
    this.parent(component);
  },
  
  isOpen: function() {
    return this.container ? true : false;
  },
  
  hide: function() {
    this.destroy();
  },
  
  destroy: function() {
    if (this.destroying) return;
    this.destroying = true;
    
    if (this.content) {
      // We want to avoid going in circles...
      var content = this.content;
      delete this.content;
      content.destroy();
    }
    
    this.screen.destroy();
    delete this.screen;
    this.container.destroy();
    
    delete this.container;
    delete this.destroying;
    
    this.fireEvent('destroyed', {}, 1);
    this.removeEvents('destroyed');
  }
});

Mobile.Overlay.create = function(name, options) {
  options = typeof(options) == 'object' ? options : {};
  if (!options["class"]) options["class"] = Mobile.Overlay;
  options.type = "overlay";
  
  Mobile.Components[name] = options;
  var loader = new Mobile.Component.Loader(name);
  loader.load();
};

