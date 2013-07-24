Mobile.Components["Text"] = {
  url: "/mobile/templates/text.html",
  'class': new Class({
    Extends: Mobile.Component,
	name: "Text",
	
	build: function() {
	  this.container.getElement('.text').set('html', 'HTML!!!');
	}
  })
};