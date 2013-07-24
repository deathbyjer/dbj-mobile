Mobile.Component.create('ScrollableView', {
  'class': new Class({
    Extends: Mobile.Component,
	name: 'ScrollableView',
	
	// Overload these.
	
	// The url where we can get more.
	get_more_at: false,
	item_component: Mobile.Component,
	per_page: 4,
	paged: true,
	
	setData: function(data) {
	  if (typeOf(data) != 'array' || !this.item_component)
	    this.parent(data);
		
	  for (var i = 0; i < data.length; i++) {
	    var component = new this.itemComponent();
	    component.setData(data[i]);
		this.addComponent(component);
	  }
	},
	
	initialize: function() {
	  this.page = 0;
	},
	
	build: function() {
	}
  })

});