if (!window.Mobile) Mobile = {};

Mobile.Request = new Class({
  
  loaders: [],

  initialize: function(url) {
    this.url = url;
	this.options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
  },
  
  start: function() {
    Router.addEvent('routed', this.routed.bind(this));
    Router.addEvent('requestCompleted', this.requestCompleted.bind(this));
    return Router.routeTo(this.url);
  },
  
  controller: false,
  action: false,
  params: {},
  
  routed: function(action) {
    this.controller = Mobile.Controllers[action.controller] || false;
    this.action = this.controller[action.action] || false;
    this.params = action.params;
	
	this.prefetch();
  },
  
  prefetch: function() {
    if (!this.controller || !this.action) return;
	
    this.layoutChanging = !Mobile.Current.Layout || (new_layout && new_layout != Mobile.Current.Layout.name)
	
    if (!Mobile.Layout.isLoaded(this.controller.layout))
      this.loaders.push(new Mobile.Layout.Loader(this.controller.layout));
	
    if (!Mobile.Layout.isLoaded(this.action.layout))
      this.loaders.push(new Mobile.Layout.Loader(this.action.layout));
      
    if (this.controller.needed_layouts)
	  for (var i = 0; i < this.controller.needed_layouts.length; i++)
		this.loaders.push(new Mobile.Layout.Loader(this.controller.needed_layouts[i]));
      
    if (this.action.needed_layouts)
	  for (var i = 0; i < this.action.needed_layouts.length; i++)
		this.loaders.push(new Mobile.Layout.Loader(this.action.needed_layouts[i]));
      
    if (this.controller.needed_components)
      this.loaders.push(new Mobile.Component.MultiLoader(this.controller.needed_components));
      
    if (this.action.needed_components)
      this.loaders.push(new Mobile.Component.MultiLoader(this.action.needed_components));
    
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
	
	if (this.action.assetsLoaded)
	  this.action.assetsLoaded(this);
    
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
	
	if (this.action.complete)
	  this.action.complete(this);
	
	this.destroy();
  },
  
  removeLoaders: function() {
    while(this.loaders.length > 0)
      this.loaders.pop().destroy();
  },
  
  removeRouterEvents: function() {
    Router.removeEvent('routed', this.routed.bind(this));
    Router.removeEvent('requestCompleted', this.requestCompleted.bind(this));
  },
  
  destroy: function() {
    this.removeRouterEvents();
    delete this.router;
	delete this.data;
	delete this.params;
  }
});

Request.tryUrl = function(url) {
  var req = new Mobile.Request(url);
  req.start();
};

History.addEvent('change', function(url) {
  Request.tryUrl(url);
  console.log(History);
});