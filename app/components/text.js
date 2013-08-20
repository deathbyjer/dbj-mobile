Mobile.Components["Text"] = {
  url: "/mobile/templates/text.html",
  
  states: {
    firstState: {
      enter: function() {
      console.log("ENTER");
    },
      
    exit: function() {
      console.log("EXIT");
      },
    }
  },
    
  'class': new Class({
    Extends: Mobile.Component,
    name: "Text",
    
    build: function() {
      this.container.getElement('.text').set('html', this.data.item);
    }
  })
};