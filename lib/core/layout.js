if (!window.Mobile) Mobile = {};

Mobile.Layout = new Class({
  Extends: Mobile.Component,
  currentComponents: {},
  
  initialize: function() {
    this.layout = Mobile.Layouts[this.name];
  },
  
  preloaded: function(element) {
    this.parent(element);
	this.buildFrameAreas();
  },
  
  findMyFrames: function() {
	var myFrames = [];
	
	this.container.getElements('.mobile-frame').each(function(el) {
	  for (var i = 0; i < myFrames.length; i++) {
	    if (myFrames[i].contains(el))
		  return;
		if (el.contains(myFrames[i])) 
		  myFrames.erase(myFrames[i]);
	  }
	  myFrames.push(el);
	});
	return myFrames;
  },
  
  buildFrameAreas: function() {
	var myFrames = this.findMyFrames();
	for (var i = 0; i < myFrames.length; i++) {
	  var children = myFrames[i].getChildren(), framearea = new Element('div', { 'class': 'mobile-frame-area'});
	  myFrames[i].grab(framearea);
	  children.each(function(el) {
	    framearea.grab(el);
	  });
	}
  },
  
  generate: function() {
    this.parent();
	this.buildFrameAreas();
  },
  
  generateFrames: function() {
	
  },
  
  getTransition: function() {
    if (this.layout.transition) 
      if (Mobile.Transitions[this.layout.transition])
        return Mobile.Transitions[this.layout.transition];
    return Mobile.Transitions[Mobile.Layouts['default'].transition];
  },
  
  getComponentContainer: function() {
    var layout = Mobile.Layouts[this.name], frame = arguments[0];
    if (layout.frames && layouts.frames.length > 1) {
      var exists = this.container.getElement('.mobile-frame[data-frame=' + frame + ']')
      if (exists) 
        return exists;
    }
    
    return this.container.getElement('.mobile-frame');
  },
  
  replaceComponent: function(component) {
    var layout = Mobile.Layouts[this.name], 
	    options = typeof(arguments[1]) == 'object' ? arguments[1] : {},
		frame = false, old = false, name = "default";
	
	// Load the frame
	var frame = this.container.getElement('.mobile-frame');	
    if (layout.frames && options.frame) {
      frame = this.container.getElement('.mobile-frame[data-frame=' + options.frame + ']')
	  if (!frame)
	    frame = this.container.getElement('.mobile-frame');
	  else 
	    name = options.frame
    }
	
	var old = this.currentComponents[name];
	this.currentComponents[name] = component;
	component.layout = this;
	
	var components = [component]
	if (old) components.push(old);
	var transition_options = { transition: options.transition || this.default_transition || Mobile.Configs.UX.default_transition || Mobile.Transitions.Plain,
                               layout: this,
							   components: components};
	
	if (options.reverse)
	  transition_options.reverse = true;
	  
	component.renderInto(this, options);
	
	transition_options.toDelete = old;
	
	var old_container = old ? old.container : false
 	if (!old_container && frame.getChildren('.mobile-frame-area')[0].getChildren('.mobile-container'))
	  old_container = frame.getChildren('.mobile-frame-area')[0].getChildren('.mobile-container')[0];
	Mobile.SwapComponents.start(old_container, component.container, frame.getChildren('.mobile-frame-area')[0], transition_options);
  }
});

// loaders is an array of loader creation objects.
// needed_components are the names of all the components it may need to preload
// transition - the way the layout should appear

Mobile.Layouts = {};

Mobile.Layout.create = function(name, options) {
  var component_options = {}, layout_options = {};
  
  if (options['class']) component_options['class'] = options['class'];
  if (options.url) component_options.url = options.url;
  if (options.html) component_options.html = options.html;
  
  layout_options.needed_components = options.needed_components || [];
  layout_options.child_layouts = options.child_layouts || [];
  layout_options.loaders = options.loaders || [];
  
  if (options.transition)  layout_options.transition = options.transition;
  
  Mobile.Components[name] = component_options;
  Mobile.Layouts[name] = layout_options;
};


Mobile.Layout.create("FrameworkLayout",  {
  "class": new Class({
    Extends: Mobile.Layout,
	preloaded: function(element) { this.container = element; this.elements = [element]; this.buildFrameAreas(); }
  })
});

Mobile.Layout.create('default', {
  transition: "Plain"
});

Mobile.Layout.isLoaded = function(layout) {
  if (!Mobile.Layouts[layout]) return true;
  return Mobile.Layouts[layout].loaded;
};

Mobile.Layout.Loader = new Class({
  Implements: Events,
  
  loaders: [],
  childLoaders: [],
  initialize: function(layout) {
    this.layout = Mobile.Layouts[layout] || {};
    this.loaders = [];
    if (!this.layout || this.layout.loaded) {
      this.loaded = true;
      return;
    }
	
    if (!this.layout.loader) 
	  this.layout.loader = this;
	
    if (this.layout.child_layouts)
      for (var i = 0; i < this.layout.child_layouts.length; i++)
        this.childLoaders.push(new Mobile.Layout.Loader(this.layout.child_layouts[i]));
    
    if (!Mobile.Component.isLoaded(layout))
      this.loaders.push(new Mobile.Component.Loader(layout));
      
    if (this.layout.needed_components)
      this.loaders.push(new Mobile.Component.MultiLoader(this.layout.needed_components));
    
    if (this.layout.loaders)
      for (var i = 0; i < this.layout.loaders; i++)
        this.loaders.push(new this.layout.loaders[i]());
    
    for (var i = 0; i < this.loaders.length; i++)
      this.loaders[i].addEvent('loaded', this.loaderFinished.bind(this));
    
    for (var i = 0; i < this.childLoaders.length; i++)
      this.childLoaders[i].addEvent('loaded', this.loaderFinished.bind(this));
  },
  
  load: function() {
    if (this.layout.loader != this) {
      this.layout.loader.addEvent('loaded', this.fullyLoaded.bind(this));
      if (this.layout.loader.loaded)
        this.fullyLoaded();
		
	  return;
	}
	
    for (var i = 0; i < this.loaders.length; i++)
      this.loaders[i].load();
      
    for (var i = 0; i < this.childLoaders.length; i++)
      this.childLoaders[i].load();
    
    // In case we are all empty
    this.loaderFinished();
  },
  
  loaderFinished: function() {
    for (var i = 0; i < this.loaders.length; i++)
      if (!this.loaders[i].loaded)
        return;
        
    for (var i = 0; i < this.childLoaders.length; i++)
      if (!this.childLoaders[i].loaded)
        return;
		
    this.layout.loaded = true;
	this.fullyLoaded();
  },
  
  fullyLoaded: function() {
    this.destroy();
    this.loaded = true;
    this.fireEvent('loaded');
  },
  
  destroy: function() {
    while (this.loaders.length > 0) {
      if (this.loaders[0].destroy)
        this.loaders[0].destroy();
        
      this.loaders.shift();
    }
    
    while (this.childLoaders.length > 0) {
      if (this.childLoaders[0].destroy)
        this.childLoaders[0].destroy();
        
      this.childLoaders.shift();
    }
        
    delete this.loaders;
  }
  
});
