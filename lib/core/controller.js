if (!window.Mobile) Mobile = {}

Mobile.Controllers = {};

Mobile.Controller = {};

Mobile.Controller.Filters = {
  before: {
    controller: {
      '*': {}
    }
  },
  
  after: {
    controller: {
      '*': {}
    }
  }
}

Mobile.Controller.beforeFilter = function(when, func) {
  if (typeof(func) != 'function') return;
  var controllers = ['*'], actions = ['*'];
  if (typeof(when) == 'object') {
    if (when.controllers)
      controllers = typeOf(when.controllers) == 'array' ? when.controllers : [ when.controllers ];
    if (when.actions)
      actions = typeOf(when.actions) == 'array' ? when.actions : [ when.actions ];
  }  
  
  var filters = Mobile.Controller.Filters;
  for (var i = 0; i < controllers.length; i++) {
    if (!filters.before[controllers[i]])
      filters.before[controllers[i]] = {};
  
    for (var j = 0; j < actions.length; j++) {
      if (!filters.before[controllers[i]][actions[j]])
        filters.before[controllers[i]][actions[j]] = [];
        
      filters.before[controllers[i]][actions[j]].push(func);
    }
  }
};

Mobile.Controller.callBeforeFilter = function(controller, action, request) {
  var filters = Mobile.Controller.Filters;
  
  // First, we'll check for global filters
  if (typeof(filters.before['*']) == 'object') {
    if (filters.before['*']['*']) for (var i = 0; i < filters.before['*']['*'].length; i++)
      if (filters.before['*']['*'][i](request) === false)
        return false;
      
    if (filters.before['*'][action]) for (var i = 0; i < filters.before['*'][action].length; i++)
      if (filters.before['*'][action][i](request) === false)
        return false;
  }
  
  // Then, the controller-specific filters
  if (typeof(filters.before[controller]) == 'object') {
    if (filters.before[controller]['*']) for (var i = 0; i < filters.before[controller]['*'].length; i++)
      if (filters.before[controller]['*'][i](request) === false)
        return false;
      
    if (filters.before[controller][action]) for (var i = 0; i < filters.before[controller][action].length; i++)
      if (filters.before[controller][action][i](request) === false)
        return false;
  }
  
  return true;
};