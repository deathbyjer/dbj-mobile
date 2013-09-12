Mobile.Component.create('ScrollableView', {
  'class': new Class({
    Extends: Mobile.Layout,
    name: 'ScrollableView',
    
    // Overload these.
    
    // The url where we can get more.
    get_more_at: false,
    item_component: Mobile.Component,
    data_type: "json",
    
    vertical: true,
    start_from: 1,
    first_page: 0,
    page_name: "page",
    per_page_name: "per_page",
    
    per_page: 4,
    paged: true,
    scroller: false,
    
    setData: function(data) {
      if (typeOf(data) != 'array' || !this.item_component)
        this.parent(data);
    },
    
    holding_container: false,
    getComponentContainer: function() {
      return this.holding_container;
    },
    
    getFullContainer: function() {
      return this.holding_container;
    },
    
    Request: false,
    initialize: function() {
      this.page = 0;
      switch(this.data_type) {
        case 'json':
          this.Request = Request.JSON;
          break;
        default:
          this.Request = Request;
      }
      
      if (!this.get_more_at) 
        this.get_more_at = "";
      
      this.get_more_at += (this.get_more_at.indexOf('?') == -1 ? "?" : "&")
    },
    
    set_get_more_at: function(url) {
      this.get_more_at = url;
      this.get_more_at += (this.get_more_at.indexOf('?') == -1 ? "?" : "&")
    },
    
    prebuilt_components: [],
    buildPrebuiltComponents: function() {
      for (var i = 0; i < this.pages_to_show; i++) {
        var page = [];
        for (var j = 0; j < this.per_page; j++) {
          var component = Mobile.Component.generate(this.item_component);
          page.push(component);
          component.simpleGenerate();
          component.addEvent('built', this.makeHardwareAccelerated.bind(component));
          if (!this.vertical)
            component.addEvent('rendered', this.horizontalSizing.bind(component));
        }
        this.prebuilt_components.push(page);
      }
    },
    
    
    build: function() {
      this.buildPrebuiltComponents();
      
      if (!this.vertical) {
        this.holding_container = new Element('div', { styles: { position: 'relative'}});
        this.holding_container.addClass('horizontal-scroller');
        this.holding_container.grab(this.container);
        if (!this.scroller) this.scroller = this.holding_container;
      } else {
        this.holding_container = this.container;
        if (!this.scroller) 
          this.scroller = window;
        else {
          if (Mobile.Configs.ImageMemoryManager)
            Mobile.ImageMemoryManager.addScroller(this.scroller);
        }
      }
      
      this.container.addClass('scrollable-view');
      this.load_data(this.pages_to_show);
      return false;
    },
    
    render: function() {
      this.show_from_page( this.current );
      this.height = this.container.getSize().y;
      this.width = this.container.getSize().x;
      this.boundScroll = this.on_scroll.bind(this);
      this.boundTouchStart = this.touchStart.bind(this);
      this.boundTouchEnd = this.touchEnd.bind(this);
      this.scroller.addEvent('scroll:throttle(250)', this.boundScroll);
      this.scroller.addEvent('touchstart', this.bounceTouchStart);
      this.scroller.addEvent('touchend', this.boundTouchEnd);
    },
    
    touchStart: function() {
      this.startedTouch = true;
      this.on_scroll();
    },
    
    touchEnd: function() {
      delete this.startedTouch;
    },
    
    // private methods and stuff
    
    all_pages: [],
    finished: false,
    
    current: 0,
    current_page: function() {
      var guess = this.current;
      
      
      var two_ago = -1, one_ago = -1, scroll = (this.vertical ? this.scroller.getScroll().y : this.scroller.getScroll().x);
      
      while(true) {
        if (guess < 0) return 0;
        if (guess >= this.all_pages.length) return this.all_pages.length;
        
        if (guess == two_ago || guess == one_ago) break;
        
        one_ago = guess;
        two_ago = one_ago;
        // Scroll should be somewhere between the start of this frame
        //  And the start of the next frame
        // If the scroll is less than the start of this frame, then we need to move forward one
        if (scroll < this.all_pages[guess].start)
          guess--;
        // If the scroll is greater then the start of the next grame, then we need to move back one
        else if (guess+1 < this.all_pages.length && scroll > this.all_pages[guess+1].start)
          guess++;
        else
          break;
      }
      
      this.current = guess;
      return guess;
    },
    
    pages_to_show: 5,
    pages_to_load: 7,
    on_scroll: function() {
      clearTimeout(this.scrollingTimeout);
      
      var old_current = this.current, new_current = this.current_page();
      if (old_current != new_current) this.show_from_page( this.current_page() );
      
      if (this.startedTouch)
        this.scrollingTimeout = setTimeout(this.on_scroll.bind(this), 200);
    },
    
    reload: function() {
      for (var i = 0; i < this.all_pages.length; i++) {
        if (this.all_pages[i].unzipped)
          this.all_pages[i].destroy();
        else
          this.all_pages[i].container.destroy();
      }
      
      this.all_pages.clear();
      this.load_data();
    },
    
    dataLoader: false,
    load_data: function(until) {
       if (!until)
         until = this.pages_to_show;
    
      until += this.start_from - 1;
      this.dataLoader = new this.Request({ method: 'GET' });
      this.dataLoader.addEvent('success', this.buildFromData.bind(this));
      
      this.dataLoader.send({
        url: this.get_more_at + this.page_name + "=" + (this.start_from - 1 + this.first_page) + "&" + this.per_page_name + "=" + ( this.per_page * until )
      });
    },
    
    buildFromData: function(data) {  
      for (var i = 0; i < data.length / this.per_page; i++) {        
        var container = new Element('div');
        container.setStyle('-webkit-transform', 'translate3d(0,0,0)');
        container.setStyle('transform', 'translate3d(0,0,0)');
        container.setStyle('position', 'relative');
        this.all_pages.push( new this.Page(this, container, i) );
        this.container.grab(container);
        
        this.all_pages[i].data = data.slice(i*this.per_page, (i+1)*this.per_page);
      }
      this.dataLoader.removeEvents('success');
      delete this.dataLoader;
      
      this.finishedBuilding();
    },
    
    show_from_page: function(current) {
      var start = Math.max(current - parseInt(this.pages_to_show/2), 0),
          end = current + parseInt(this.pages_to_show/2);
            
      if (end - start + 1 < this.pages_to_show)
        end += (this.pages_to_show - end + start - 1)
            
      if (end >= this.all_pages.length && this.finished)
        end = this.all_pages.length;
        
      if (start < 0) start = 0;
        
      for (var i = this.all_pages.length; i <= end; i++) {
        var container = new Element('div');
        container.setStyle('-webkit-transform', 'translate3d(0,0,0)');
        container.setStyle('transform', 'translate3d(0,0,0)');
        container.setStyle('position', 'relative');
        this.all_pages.push( new this.Page(this, container, i) );
        this.container.grab(container);
      }
      
      var i = 0;
      for (; i < start; i++)
        this.all_pages[i].removeDOM();
      for (; i <= end; i++) 
        this.all_pages[i].showDOM();
      for (; i < this.all_pages.length; i++)
        this.all_pages[i].removeDOM();
    },
    
    serializePage: function(i) {
      if(!this.all_pages[i].unzipped)
        return;
        
      this.all_pages[i].removeDOM();  
      this.all_pages[i] = this.all_pages[i].serializeAndDestroy();
    },
    
    unserializePage: function(i) {
      if(this.all_pages[i].unzipped) return;
      
      var page = this.all_pages[i];
      this.all_pages[i] = new this.Page(this);
      this.all_pages[i].unserialize(page);
    },
    
    resize: function() {
      for (var i = 0; i < this.all_pages.length; i++)
        if (this.all_pages[i].unzipped)
          this.all_pages[i].resize();
        
      var width = 0, max_height = 0;
      if (!this.vertical) {
        for (var i = 0; i < this.all_pages.length; i++) {
          width += this.all_pages[i].container.getSize().x;
          max_height = Math.max(max_height, this.all_pages[i].container.getSize().y);
        }
        this.container.setStyle('width', width);
        this.container.setStyle('height', max_height);
      }
    },

    destroy: function() {
      this.scroller.removeEvent('scroll:throttle(250)', this.boundScroll);
      this.scroller.removeEvent('scroll', this.boundScroll);
      this.scroller.removeEvents('touchstart', this.boundTouchStart);
      this.scroller.removeEvents('touchend', this.boundTouchEnd);
      
      clearTimeout(this.scrollingTimeout);
      
      delete this.boundScroll;
      for (var i = 0; i < this.all_pages.length; i++) {
        if (this.all_pages[i].unzipped)
          this.all_pages[i].destroy();
      }
      
      this.all_pages.length = 0;
      delete this.all_pages;

      this.parent();
    },
    
    Page: new Class({
      Extends: Mobile.Component,
    
      owner: false,
      page_number: false,
      loader: false,
      data: false,
      
      container: false,
      components: false,
          
      getComponentContainer: function() {
        return this.container;
      },
      
      initialize: function(parent, container, page_number) {
        this.unzipped = true;
        this.owner = parent;
        
        if (container)
          this.container = container;
        if (page_number)
          this.page_number = page_number;
      },
      
      showImmediately: false,
      load: function(thenShow) {
        if (this.data)
          return this.afterLoaded(this.data);
          
        if (!this.loader) this.loader = new this.owner.Request({method: "GET"});
        
        if (thenShow)
          this.showImmediately = true;
          
        this.loader.addEvent('success', this.afterLoaded.bind(this));
        var page = this.owner.first_page + this.page_number + this.owner.start_from - 1;
        
        this.loader.send({
          url: this.owner.get_more_at + this.owner.page_name + "=" + (page) + "&" + this.owner.per_page_name + "=" + this.owner.per_page
        });
      },
      
      afterLoaded: function(data) {
        this.data = data;
        
        delete this.loader;
        if (this.showImmediately) {
          this.showImmediately = false;
          this.showDOM();
        }
      },
      
      horizontalPlacement: function() {
        var left = 0;
        if (this.page_number != 0) {
          var container = this.owner.all_pages[this.page_number - 1].container;
          left = container.getPosition(container.getParent()).x + container.getSize().x;
        } 
        
  /*      this.container.setStyles({
          left: left,
          position: 'absolute'
        });
  */
      },
      
      buildDOM: function() {
        if (!this.data) { 
          this.load(true);
          return false;
        }
        
        this.components = this.owner.prebuilt_components[this.page_number % this.owner.prebuilt_components.length];
        
        var some_loaded = false;
        for (var i = 0; i < this.components.length; i++) {
          if (this.data[i]) {
            this.components[i].container.setStyle('display', '');
            this.components[i].setData(this.data[i]);
            this.components[i].postGeneration();
            some_loaded = true;
          } else {
            this.components[i].container.setStyle('display', 'none');
          }
        }
        
        if (!some_loaded) {
          this.owner.finished = true;
        }
      },
      
      showDOM: function() {
        if (this.isShown) return;
        if (this.buildDOM() === false) return;
        
      //  this.container.setStyle('height', '');
      //  this.container.setStyle('width', '');
        
        //if (!this.owner.vertical)
        //  this.horizontalPlacement();
        
        if (!this.owner.noMoreShowing) {
          for (var i = 0; i < this.components.length; i++)
            this.components[i].renderInto(this, true);
          this.container.setStyle('height', this.container.getSize().y);
          this.container.setStyle('width', this.container.getSize().x);
        } else {
          this.container.setStyle('height', this.components[0].container.getParent().getSize().y);
          this.container.setStyle('width', this.components[0].container.getParent().getSize().x);
        }
        
        
        this.owner.resize();
        
        this.start = this.owner.vertical ? this.container.getPosition(this.container.getParent()).y : this.container.getPosition(this.container.getParent()).x;
        this.isShown = true;
      },
      
      removeDOM: function() {        
        delete this.isShown;
      },
      
      serialize: function() {
        return { data: this.data, container: this.container, start: this.start, page_number: this.page_number };
      },
      
      unserialize: function(data) {
        this.data = data.data;
        this.container = data.container;
        this.start = data.start;
        this.page_number = data.page_number;
      },
      
      destroy: function() {
        //this.removeDOM();
        delete this.data;
        this.container.dispose();
        delete this.container;
      },
      
      serializeAndDestroy: function() {
        var serialized = this.serialize();
        //this.removeDOM();
        delete this.loader;
        return serialized;
      },
      
      resize: function() {
        if (this.container && this.container.getChildren() != 0) {
          var oldSize = this.container.getStyle('height');
          this.container.setStyle('height', '');
          var newSize = this.container.getSize().y
          this.container.setStyle('height', newSize == 0 ? oldSize : newSize);
          
          if (!this.owner.vertical) {
            oldSize = this.container.getStyle('width');
            this.container.setStyle('width', '');
            newSize = this.container.getSize().x
            this.container.setStyle('width', newSize == 0 ? oldSize : newSize);
          }
        }
      },
      
      saveSize: function() {
        this.container.setStyle('height', this.container.getSize().y);
        this.container.setStyle('width', this.container.getSize().x);
      }
    }),
  
    horizontalSizing: function() {
      this.container.setStyle('display', 'inline-block');
      this.container.setStyle('width', this.container.getSize().x);
    },
        
    makeHardwareAccelerated: function() {
      this.container.setStyle('-webkit-transform', 'translate3d(0,0,0)');
    }
  })

});
