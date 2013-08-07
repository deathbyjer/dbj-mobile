if (!window.Mobile) Mobile = {};

Mobile.Request = new Class({
  
  loaders: [],

  initialize: function(url) {
    this.url = url;
	this.options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
  },
  
  start: function() {
    if (!Router.isNewUrl(this.url))
	  return this.checkActionsAndFinish();
  
    this.boundRouted = this.routed.bind(this);
    this.boundRequestCompleted = this.requestCompleted.bind(this);
	
    Router.addEvent('routed', this.boundRouted);
    Router.addEvent('requestCompleted', this.boundRequestCompleted);
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
    var param_array = param_list.split("&")
    for (var i = 0; i < param_array; i++) {
      var params = param_array[i].split("=");
      if (params.length)
        this.params[params[0]] = params[1];
    }
    
    this.prefetch();
  },
  
  prefetch: function() {
    if (!this.controller) return;
    this.layoutChanging = !Mobile.Current.Layout || (new_layout && new_layout != Mobile.Current.Layout.name)
	
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
    
    var layout = this.orig_params.layout || (this.action && this.action.layout) || this.controller.layout;
    
    if (layout && Mobile.Layouts[layout]) {
      layout_options = {}
      if (History.last < 0) 
      layout_options.reverse = true;
      Mobile.Current.setMainLayout(layout, layout_options);
    }
    
    if (!this.action || !this.action.complete) {
      var cname = this.orig_params.component || this.orig_params.controller + '.' + this.orig_params.action
      if (Mobile.Components[cname]) {
        result = Mobile.Component.generate(cname);
      result.setData(this.data);
      }
    }
    else if (this.action.complete)
      result = this.action.complete(this);
    
    
    // If the result is a component, we are going to swap
    
    if (instanceOf(result, Mobile.Component)) {
      replaceoptions = {}
      if (History.last < 0) 
      replaceoptions.reverse = true;
      Mobile.Current.mainLayout.replaceComponent(result, replaceoptions);
    }
      this.checkActionsAndFinish();
    },
    
    checkActionsAndFinish: function() {
    this.checkActions();
    this.destroy();  
  },
  
  checkActions: function() {
    var action = this.url.replace(/^[^#]*#?/, '') || false
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

Request.All = [];

Request.tryUrl = function(url) {
  Request.All.unshift( new Mobile.Request(url) );
  Request.All[0].start();
};

// Garbage Collect all the Requests
Request.GC = function() {
  var i = 0, length = Request.All.length;
  for (i = 0; i < length; i++) 
    if (Request.All[i] && Request.All[i].readyToDelete)
	  delete Request.All[i];
	  
  i = 0;
  while ( i < length ) {
    if (Request.All[i]) 
	  i++;
	else {
	  Request.All.splice(i, 1);
	  length--;
	}
  }
};

Request.GC.periodical(500);

History.addEvent('change', function(url) {  
  Request.tryUrl(url);
});
