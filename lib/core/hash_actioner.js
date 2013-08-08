if (!window.Mobile) Mobile = {};

Mobile.HashActioner = new new Class({
  Implements: [Events],
  
  lastAction: false,
  actions: {},
  
  registerForAction: function(action, enter, exit) {
    if (!this.actions[action]) 
	  this.actions[action] = { enter: [], exit: [] };
	  
	if (typeof(enter) == 'function')
  	  this.actions[action].enter.push(enter);
	  
	if (typeof(exit) == 'function')
  	  this.actions[action].exit.push(exit);
  },
  
  unregisterFromAction: function(action, enter, exit) {
    if (!this.actions[action]) return;
	
	this.actions[action].enter.erase(enter);
	this.actions[action].exit.erase(exit);
  },
  
  doAction: function(action) {
    if (this.lastAction && this.actions[this.lastAction])
	  for (var i = 0; i < this.actions[this.lastAction].exit.length; i++)
	    this.actions[this.lastAction].exit[i]();
		
    this.lastAction = action;
	
    if (this.lastAction && this.actions[this.lastAction])
	  for (var i = 0; i < this.actions[this.lastAction].enter.length; i++)
	    this.actions[this.lastAction].enter[i]();
  }
});
