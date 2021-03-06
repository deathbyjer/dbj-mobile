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
  
  getFullContainer: function() {
    return this.container;
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
  
  states: {},
  postBuild: function() {
    var options = Mobile.Components;
    if (!options[this.name] || !options[this.name].states) return;
    var states = options[this.name].states
    for (var state in states) if (states.hasOwnProperty(state)) {
      this.states[state] = {};
      if (states[state].enter) this.states[state].enter = states[state].enter.bind(this);
      if (states[state].exit) this.states[state].exit = states[state].exit.bind(this);
      
      Mobile.HashActioner.registerForAction(state, this.states[state].enter, this.states[state].exit);
    }
  },

  generate: function() {
    this.simpleGenerate();
      
    return this.postGeneration();
  },
  
  simplyGenerated: false,
  simpleGenerate: function() {
    if (this.simplyGenerated) return;
    this.simplyGenerated = true;
    
    var tmp = new Element('div').set('html', this.default_html());
    this.elements = tmp.getChildren();
    
    if (!this.container)
      this.container = this.generateContainer();
    
    this.elements.each(function(el) {
      this.container.grab(el);
      }, this);
	
    // Generate the sub components before we finish the build
    for ( var i = 0; i < this.components; i++)
      this.components[i].simpleGenerate();
  },
  
  postGeneration: function() {
  
    // Generate the sub components before we finish the build
    for ( var i = 0; i < this.components; i++)
      this.components[i].postGeneration();  
      
    // Let's give the component the ability to build and involve server calls
    if (this.build() !== false)
      this.finishedBuilding();
      
    // Only do this in the case that we are using an image memory manager
    if (Mobile.Configs.ImageMemoryManager) {
      this.container.getElements('img').each(function(image) {
        Mobile.ImageMemoryManager.addImage(image);
      });
    }
    
    return this.element;
  },
  
  finishedBuilding: function() {
    this.built = true;
    this.fireEvent('built', this.element);
	
    this.postBuild();
    return this.element;
  },
  
  putInLayout: function(container) {
    var parent = typeOf(container) == 'element' ? container : this.componentParent.getComponentContainer()
    if (parent && !parent.contains(this.getFullContainer())) {
      parent.grab(this.getFullContainer());
    }
  },

  renderInto: function(layout, keep) {
    if (!this.built) this.generate();
	
    if (instanceOf(layout, Mobile.Component))
      this.componentParent = layout;
    
    if (!keep) this.container.setStyles({
        visibility: 'hidden'
    });
     
    this.putInLayout(layout);
	
	  this.container.addEvent("click:relay(a:not([href=#],[href^=http://],[data-noxhr]))", Mobile.HistoryListener);
    this.render();
    this.fireEvent('rendered', this.element);
    
    
    // Only do this in the case that we are using an image memory manager
    if (Mobile.Configs.ImageMemoryManager) {      
      Mobile.ImageMemoryManager.scroll();
    }
    
    if (!keep) {
      this.container.dispose();
      this.container.setStyles({
        visibility: ''
      });
    }
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
  
  destroy: function(dontDelete) {
    if (this.components)
      this.emptyComponents();
    delete this.components;
    delete this.data;
    
    if (this.container) {
      this.container.getElements('img').each(function(img) {
        img.set('src',  Mobile.Configs.ImageMemoryImage);
      });
      (function(){this.destroy();}).delay(20000, this.container);
    }
    delete this.container;
    
    // Delete the states
    for ( var state in this.states) if (this.states.hasOwnProperty(state)) {
      Mobile.HashActioner.unregisterFromAction(state, this.states[state].enter, this.states[state].exit);
      delete this.states[state].enter;
      delete this.states[state].exit;
      delete this.states[state];
    }
    delete this.states;
    delete this.built;
    
    this.fireEvent('destroyed', this);
    this.removeEvents('destroyed');
    
    if (!dontDelete)
      this.readyToDelete = true;
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

Mobile.Component.All = [];

Mobile.Component.generate = function(component) {
  Mobile.Component.All.unshift(Mobile.Components[component] && Mobile.Components[component]["class"] ? new Mobile.Components[component]["class"]() : new Mobile.Component());
  return Mobile.Component.All[0];
}

Mobile.Component.GC = function() {
  var i = 0, length = Mobile.Component.All.length;
  for (i = 0; i < length; i++) 
    if (Mobile.Component.All[i] && Mobile.Component.All[i].readyToDelete)
	  delete Mobile.Component.All[i];
	  
  i = 0;
  while ( i < length ) {
    if (Mobile.Component.All[i]) 
	  i++;
	else {
	  Mobile.Component.All.splice(i, 1);
	  length--;
	}
  }  
};

Mobile.Component.GC.periodical(500);

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

	if (this.componentLoaders)
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
    if (this.component.loaded) {
	  this.fullyLoaded();
	  return;
	}
	
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
	this.destroy();
  },
  
  destroy: function() {
    delete this.request;
  }
});

Mobile.GC = function() {
  for (var i in Mobile.Components) if (Mobile.Components.hasOwnProperty(i)) 
    if (Mobile.Components[i].loaded && Mobile.Components[i].loader)
      delete Mobile.Components[i].loader;	
};

Mobile.GC.periodical(1000);