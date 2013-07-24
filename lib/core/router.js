Router = new new Class({
  Implements: [Events],

  routedUrl: false,
  initialize: function() {
    this.requestObject = new Request();
    this.requestObject.addEvent('success', this.requestSuccess.bind(this));
  },
  
  routes: [],
  
  setRoutes: function(list) {
    // Build and return
    this.routes = [];
	this.addRoutes(list);
  },

  addRoutes: function(list) {
    for (var i in list) if (list.hasOwnProperty(i))
      this.routes.push({check: new RegExp("^" + i.replace(/\//g, "\\/") + "$"), action: list[i]})
  },

  requestImmediately: true,
  _state: 'ready',
  
  isNewUrl: function(url) {
    return url.replace(/#.*$/, '') != this.routedUrl;
  },

  routeTo: function(url) {
    // Routing is a multi-state process. We want to be able to control multiple requests
    if (!this._state == 'ready') return;
    var matches = false, params = {}, route = false, options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
	
    this._state = 'started';
    this.url = url = url.replace(/#.*$/, '');
	
    for (var i = 0; i < this.routes.length; i++) {
      route = this.routes[i];
      matches = route.check.exec(url);
      if (matches) {
        // Pop the top and break
        matches.shift();
        break;
      }
    }
	
    // Return empty if there are no matches   
    if (!matches) return false;

    // Make sure we have something in the params area
    if (!route.action.params) route.action.params = [];
 
    // Gather the params from the match
    for (var i = 0; i < matches.length; i++)
      if (i < route.action.params.length)
        params[route.action.params[i]] = matches[i];

    route.action.params = params;
    this.request_options = options;
    this.action = route.action;
    this.fireEvent('routed', route.action);
    this._state = 'routed';
	
	this.routedUrl = url;
    if (this.requestImmediately) this.request();
    return true;
  },

  // The url and the action must be created with the route
  request: function() {
    if (!this._state == 'routed') return;
    this._state = 'requesting';

	if (this.action.noRequest) {
	  this.fireEvent('requestCompleted', { action: this.action, data: {}});
	  
	} else {
		var args = { url: this.url };
		
		// Append anything that needs to be appeneded to the url
		if (this.action.append)
		  args.url += this.action.append;
		else if (Mobile.Configs.Router.append)
		  args.url += Mobile.Configs.Router.append;
		  
		args.method = this.request_options.method || "GET";
		if (this.request_options.data) args.data = this.request_options.data;
		
		this.requestObject.send(args);
	}
  },

  requestSuccess: function(data) {
    this._state = 'finished';
    this.fireEvent('requestCompleted', { action: this.action, data: data });
  } 
})();
