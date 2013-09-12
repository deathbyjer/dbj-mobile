if (!window.Mobile) Mobile = {};

Mobile.CurrentView = false;

// This is a timer function.
//   It will check the check function and execute the run function if it passes. Otherwise, it'll check the check function
//   again. 
Mobile.CheckAndRun = new Class({
  check: false,
  run: false,
  interval: 50,
  initialize: function() {
    var options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
    if (options.check) this.setCheck(options.check);
    if (options.run) this.setRun(options.run);
    if (options.interval) this.interval = options.interval;
  },

  setCheck: function(check) {
    if (typeof(check) == 'function') this.check = check;
  },

  setRun: function(run) {
    if (typeof(run) == 'function') this.run = run;
  },

  start: function() {
    if (this.check && this.run)
      this.recurring = this.doCheckAndRun.periodical(this.interval, this);
  },

  doCheckandRun: function() {
    if (!this.check()) return;
    clearTimeout(this.recurring);
    this.run();
  }
});

Mobile.Loader = new Class({
  Implements: Events,
  loaded: false,
  load: function() {
  
  },
  
  destroy: function() {
    this.removeEvents();
  }
});

Mobile.Loaders = {};

Mobile.BeforeStartup = []

Mobile.ImageMemoryManagement = new Class({
  images: [],
  scrollers: [],
  
  initialize: function() {
    this.boundScroll = this.scroll.bind(this);
    
    window.addEvent('domready', function() {
      if (Mobile.Configs.ImageMemoryManager)
        Mobile.ImageMemoryManager.addScroller(window);
    });
  },
  
  addScroller: function(scroller) {      
    this.scrollers.push(scroller);
    scroller.addEvent('scroll:throttle(100)', this.boundScroll);
    scroller.addEvent('unload', this.unloadScroller.bind(this));
  },
  
  addImage: function(image) {
    
    image.set('data-src', image.get('src'));  
    image.set('src', Mobile.Configs.ImageMemoryImage);
    
    if (!this.images.contains(image)) {
      this.images.push(image);
      image.addEvent('unload', this.unloadImage.bind(this)); 
    }    
    
    var winScroll = window.getScroll(), winSize = window.getSize();  
    var iPos = image.getPosition();
    var iSize = image.getSize();
  },
  
  scroll: function() {      
    clearTimeout(this.scrollTimeout);
    var winScroll = window.getScroll(), winSize = window.getSize();
    
    var image = false, iPos = false, iSize = false;
    for (var i = 0; i < this.images.length; i++) {
      image = this.images[i];
      iPos = image.getPosition();
      iSize = image.getSize();
      this.checkImage(image, winScroll, winSize, iPos, iSize);
    }
    
    if (Mobile.Configs.ImageMemoryManager)
      this.scrollTimeout = setTimeout(this.scroll.bind(this), 250);
  },

  checkImage: function(image, winScroll, winSize, iPos, iSize) { 
    // This image is not on the screen
    if (iPos.x > winScroll.x + winSize.x ||
        iPos.x + iSize.x < winScroll.x ||
        iPos.y > winScroll.y + winSize.y ||
        iPos.y + iSize.y < winScroll.y) {
        // Unload if loaded
      
      if (image.get('src') == image.get('data-src'))
        image.set('src', Mobile.Configs.ImageMemoryImage);
    
    // This image IS on the screen
    } else {
        // Unload if loaded
        if (image.get('src') != image.get('data-src'))
          image.set('src', image.get('data-src'));
    } 
  },
  
  unloadImage: function(evt) {
    this.images.erase(evt.target);
  },
  
  unloadScroller: function(evt) {
    evt.target.removeEvent('scroll', this.boundScroll);
    evt.target.removeEvent('scroll:throttle(100)', this.boundScroll);
    this.scrollers.erase(evt.target);
  }

});

Mobile.ImageMemoryManager = new Mobile.ImageMemoryManagement();