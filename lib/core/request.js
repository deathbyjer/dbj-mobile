if (!window.Mobile) Mobile = {};

Mobile.Request = new Class({
  
  loaders: [],

  initialize: function(url) {
    if (typeof(url) == 'object') {
      this.full_url = url.full_url
      this.url = url.url;
    } else
      this.full_url = this.url = url;
    this.options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
    
    if (Mobile.Configs.LoadingOverlay)
      this.overlay = Mobile.Component.generate(Mobile.Configs.LoadingOverlay);
      
  },
  
  start: function() {
    if (!Router.isNewUrl(this.full_url) && !this.options.force)
      return this.checkActionsAndFinish();
    
    this.boundRouted = this.routed.bind(this);
    this.boundRequestCompleted = this.requestCompleted.bind(this);
	
    Router.addEvent('routed', this.boundRouted);
    Router.addEvent('requestCompleted', this.boundRequestCompleted);
    
    if (!Mobile.Overlay.Screen.isOpen() && this.overlay)
      this.overlay.show();
    
    return Router.routeTo(this.url);
  },
  
  controller: false,
  action: false,
  params: {},
  
  routed: function(action) {
    this.orig_params = action;
    this.controller = Mobile.Controllers[action.controller] || false;
    if (this.controller)
        this.action = this.controller[action.action];
    this.params = action.params;
    
    // Gather the other params
    var param_list = window.location.search.substr(1);
    if (param_list) {
      var param_array = param_list.split("&");
      for (var i = 0; i < param_array.length; i++) {
        var split = param_array[i].split("=");
        if (split.length > 0)
          this.params[split[0]] = split[1];
      }
    }
    
    this.prefetch();
  },
  
  prefetch: function() {
    if (!this.controller) return;
    this.layoutChanging = !Mobile.Current.Layout || (new_layout && new_layout != Mobile.Current.Layout.name)
    
    for (var i = 0; i < Mobile.BeforeStartup.length; i++) {
      this.loaders.push(new Mobile.BeforeStartup[i]);
    }
    Mobile.BeforeStartup.length = 0;
    
    if (!Mobile.Layout.isLoaded(this.controller.layout))
      this.loaders.push(new Mobile.Layout.Loader(this.controller.layout));
    
    if (this.controller.needed_layouts)
      for (var i = 0; i < this.controller.needed_layouts.length; i++)
        this.loaders.push(new Mobile.Layout.Loader(this.controller.needed_layouts[i]));
	  
    if (this.controller.needed_components)
      this.loaders.push(new Mobile.Component.MultiLoader(this.controller.needed_components));
	
    if (this.action) {
      if (!Mobile.Layout.isLoaded(this.action.layout))
        this.loaders.push(new Mobile.Layout.Loader(this.action.layout));
      
      if (this.action.needed_layouts)
	    for (var i = 0; i < this.action.needed_layouts.length; i++)
		  this.loaders.push(new Mobile.Layout.Loader(this.action.needed_layouts[i]));
            
      if (this.action.needed_components)
        this.loaders.push(new Mobile.Component.MultiLoader(this.action.needed_components));
    }
    
    for (var i = 0; i < this.loaders.length; i++) 
      this.loaders[i].addEvent('loaded', this.assetsLoaded.bind(this));
      
    for (var i = 0; i < this.loaders.length; i++)
      this.loaders[i].load();
	  
    this.assetsLoaded();
  },
  
  assetsLoaded: function() {
    for (var i = 0; i < this.loaders.length; i++)
      if(!this.loaders[i].loaded)
        return;
     
    if (this.assetsHaveBeenLoaded)
      return;
      
    this.assetsHaveBeenLoaded = true;
    this.removeLoaders(); 
	
    if (this.action && this.action.assetsLoaded)
      this.action.assetsLoaded(this);
    
    if (Mobile.Controller.callBeforeFilter(this.orig_params.controller, this.orig_params.action, this))
      Router.request();
    else
      this.destroy();
  },
 
  requestCompleted: function(evt) {
    this.removeRouterEvents();
	
    if (Mobile.Controllers[evt.action.controller] != this.controller || this.controller[evt.action.action] != this.action)
      return;

    if (this.requestHasBeenCompleted) 
      return;
    this.requestHasBeenCompleted = true;
    
    this.data = evt.data;
    
    var result = false;
    if (this.action && this.action.complete) {
      result = this.action.complete(this);
    } else if (typeof(this.action) == 'function') {
      result = this.action(this);
    }
    else if (!this.action || !this.action.complete) {
      var cname = this.orig_params.component || this.orig_params.controller + '.' + this.orig_params.action
      if (Mobile.Components[cname]) {
        result = Mobile.Component.generate(cname);
        result.setData(this.data);
      }
    }
    
    
    // Eventually, we'll want to make it only save activeComponents as an array, not each
    if (typeOf(result) == 'array') {
      this.activeComponents = []
      for (var i = 0; i < result.length; i++)
        if (instanceOf(result[i], Mobile.Component)) {
          this.activeComponents.push(result[i]);
          result[i].addEvent('built', this.activeComponentsLoaded.bind(this)); 
          result[i].generate();
        }
    }
    else if (instanceOf(result, Mobile.Component)) {
      this.activeComponents = result;
      result.addEvent('built', this.activeComponentsLoaded.bind(this));
      result.generate();
    }
    
    this.activeComponentsLoaded();
    return result;
  },
  
  haveActiveComponentsLoaded: false,
  activeComponentsLoaded: function() {  
    if (!this.activeComponents) 
      return this.destroy();
      
    if ( typeof(this.activeComponents) == 'array') {
      for (var i = 0; i < this.activeComponents.length; i++)
        if (!this.activeComponents[i].built)
          return;
    } else if (!this.activeComponents.built)
      return;
    
    if (this.haveActiveComponentsLoaded)
      return;
      
    this.haveActiveComponentsLoaded = true;
  
    var layout = this.orig_params.layout || (this.action && this.action.layout) || this.controller.layout;
    
    if (layout && Mobile.Layouts[layout]) {
      layout_options = {}
      if (History.last < 0) 
      layout_options.reverse = true;
      Mobile.Current.setMainLayout(layout, layout_options);
    }    
    
    // If the result is a component, we are going to swap
    // We also should give this a try if activeComponents are 
    if (this.activeComponents) {
      replaceoptions = {}
      if (History.last < 0) 
      replaceoptions.reverse = true;
      Mobile.Current.mainLayout.replaceComponent(this.activeComponents, replaceoptions);
    }
    this.checkActionsAndFinish();
  },
    
  checkActionsAndFinish: function() {
    this.checkActions();
    this.destroy();  
  },
  
  checkActions: function() {
    var action = this.full_url.replace(/^[^#]*#?/, '') || false
    Mobile.HashActioner.doAction(action);
  },
  
  removeLoaders: function() {
    while(this.loaders.length > 0)
      this.loaders.pop().destroy();
  },
  
  removeRouterEvents: function() {
    if (this.boundRouted)
      Router.removeEvent('routed', this.boundRouted);
	  
    if (this.boundRequestCompleted)
      Router.removeEvent('requestCompleted', this.boundRequestCompleted);
  },
  
  destroy: function() {
    if (this.overlay)
      this.overlay.destroy();
  
    this.removeRouterEvents();
	
    delete this.boundRouted;
    delete this.boundRequestCompleted;
	
    delete this.router;
    delete this.data;
    delete this.params;
    delete this.loaders;
    
    this.readyToDelete = true;
  }
});

Mobile.Request.All = [];

Mobile.Request.tryUrl = function(url, force) {
  var options = {}
  if (force)
    options.force = true;
  
  Mobile.Request.All.unshift( new Mobile.Request(url, options) );
  Mobile.Request.All[0].start();
};

// Garbage Collect all the Requests
Mobile.Request.GC = function() {
  var i = 0, length = Mobile.Request.All.length;
  for (i = 0; i < length; i++) 
    if (Mobile.Request.All[i] && Mobile.Request.All[i].readyToDelete)
	  delete Mobile.Request.All[i];
	  
  i = 0;
  while ( i < length ) {
    if (Mobile.Request.All[i]) 
	  i++;
	else {
	  Mobile.Request.All.splice(i, 1);
	  length--;
	}
  }
};

Mobile.Request.GC.periodical(500);

History.addEvent('change', function(url, state, force) {  
  Mobile.Request.tryUrl(url, force);
});
