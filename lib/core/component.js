if (!window.Mobile) Mobile = {};

Mobile.Component = new Class({
  Implements: [Events],
  name: 'default',
  built: false,
  rendered: true,
  components: [], 
  componentParent: false,
  
  initialize: function() {
  },
  
  generateContainer: function() {
    var container = new Element('div', {
	  'class': 'mobile-container'
    });
	
    return container;
  },
  
  setData: function(data) {
    this.data = data;
  },
  
  preloaded: function (elements) {
    this.elements = elements;
    this.container = this.generateContainer();
    this.elements.first().getParent().grab(this.container);
	
	this.elements.each(function(el) {
	  this.container.grab(el);
    });
	
    this.build();
    this.render();
  },
  
  setContainer: function(container) {
    this.container = container;
  },
 
  default_html: function() {
    var options = Mobile.Components;
    if (!options[this.name]) options[this.name] = { html: '<div></div>' }
    return options[this.name].html;
  },

  generate: function() {
    var tmp = new Element('div').set('html', this.default_html());
	this.elements = tmp.getChildren();
	
	if (!this.container)
	  this.container = this.generateContainer();
	
	this.elements.each(function(el) {
	  this.container.grab(el);
    }, this);
	
	// Generate the sub components before we finish the build
	for ( var i = 0; i < this.components; i++)
	  this.components[i].generate();
	  
	this.build();
    this.built = true;
    this.fireEvent('built', this.element);
    return this.element;
  },
  
  putInLayout: function() {
    var parent = this.componentParent.getComponentContainer()
    if (parent && !parent.contains(this.container)) {
      parent.grab(this.container);
    }
  },

  renderInto: function(layout) {
    if (!this.built) this.generate();
	
    this.componentParent = layout;
    
    this.container.setStyles({
      visibility: 'hidden'
    });
    
    this.putInLayout();
    
	this.container.addEvent("click:relay(a:not([href=#],[href^=http://],[data-noxhr]))", Mobile.HistoryListener);
    this.render();
    
    this.container.dispose();
    this.container.setStyles({
      visibility: ''
    });
  },
  
  // Functions to be rebuilt
  render: function() {
  },

  build: function() {
  },
  
  hashActions: function() {
    return {};
  },

  getComponents: function() { return this.components; },
  getComponentsSize: function() { return this.components.length; },
  getComponentAt: function(index) { return this.components[index]; },
  addComponent: function(component) { 
    var options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
    options.where = options.where || "after"
     
  },
  removeComponentAt: function(index) {
	var component;
    if (index >= this.components.length) return;
	
    component = this.components.splice(index, 1);
	component.destroy();
  },

  emptyComponents: function() {
    while(this.components.length > 0) {
      this.removeComponent(0);
    }
  },
  
  destroy: function() {
    this.emptyComponents();
	delete this.components;
	
	this.container.destroy();
	delete this.container;
  }
});

// Each item has the option for html or url
//  Each item also should have a class
Mobile.Components = {};

Mobile.Component.create = function(name, component) {
  Mobile.Components[name] = component;
};

Mobile.Component.create('default', {
  default: {
    html: '<div></div>'
  }
});

Mobile.Component.generate = function(component) {
  return Mobile.Components[component] && Mobile.Components[component]["class"] ? new Mobile.Components[component]["class"]() : new Mobile.Component();
}

Mobile.Component.isLoaded = function(component) {
  if (!Mobile.Components[component]) return true;
  return Mobile.Components[component].loaded;
};

Mobile.Component.MultiLoader = new Class({
  Implements: Events,
  components: [],
  componentLoaders: [],
  initialize: function(components) {
    this.components = components;
    for(var i = 0; i < this.components.length; i++) {
      if (!Mobile.Component.isLoaded(this.components[i])) {
        var loader = new Mobile.Component.Loader(this.components[i]);
        loader.addEvent('loaded', this.loaderFinished.bind(this));
        this.componentLoaders.push(loader);
      }
    }
  },
  
  load: function() {
    for (var i = 0; i < this.componentLoaders.length; i++)
      this.componentLoaders[i].load();
    
    // Gotta try, in case there's nothing to load
    this.loaderFinished();
  },
  
  loaderFinished: function() {
    for (var i = 0; i < this.componentLoaders.length; i++)
      if (!this.componentLoaders[i].loaded)
        return;
    
    this.destroy();
    this.loaded = true;
    this.fireEvent('loaded');
  },
  
  destroy: function() {
    delete this.components;
    while (this.componentLoaders.length > 0) 
      this.componentLoaders.pop().destroy();
      
    delete this.componentLoaders;
  }
});

Mobile.Component.Loader = new Class({
  Implements: Events,
  component: false,
  initialize: function(component) {
    this.name = component;
    this.component = Mobile.Components[component];
    this.loaded = false;
    
    if (this.component.loader)
      return;
	  
	this.component.loader = this;
    this.request = new Request();
    this.request.addEvent('success', this.requestComplete.bind(this));
  },
  
  load: function() {
    if (this.component.loader != this) {
      this.component.loader.addEvent('loaded', this.fullyLoaded.bind(this));
      if (this.component.loader.loaded)
        this.fullyLoaded();
		
	  return;
    }
    
    if (!this.component || this.component.loaded) {
      this.fullyLoaded();
      return;
    }  
    
    if (!this.component.url) {
      if (!this.component.html)
        this.component.html = Mobile.Components['default'].html;
        
      this.fullyLoaded();     
      return;
    }
    
    this.request.send({url: this.component.url, method: "GET"});
  },

  requestComplete: function(html) {
    this.component.html = html;
    this.component.loaded = true;
    this.fullyLoaded();
  },
  
  fullyLoaded: function() {
    this.loaded = true;
    this.fireEvent('loaded', {component: this.name});
  },
  
  destroy: function() {
    delete this.request;
  }
});