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
    first_page: 0,
    page_name: "page",
    per_page_name: "per_page",
    
    per_page: 4,
    paged: true,
    scroller: false,
    
    setData: function(data) {
      if (typeOf(data) != 'array' || !this.item_component)
        this.parent(data);
      
      for (var i = 0; i < data.length; i++) {
        var component = new this.itemComponent();
        component.setData(data[i]);
        this.addComponent(component);
      }
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
    
    build: function() {
      
      if (!this.vertical) {
        this.holding_container = new Element('div', { styles: { position: 'relative'}});
        this.holding_container.addClass('horizontal-scroller');
        this.holding_container.grab(this.container);
        if (!this.scroller) this.scroller = this.holding_container;
      } else {
        this.holding_container = this.container;
        if (!this.scroller) this.scroller = window;
      }
      
      if (this.all_pages.length < this.current + 3) {
        this.load_data(this.current + 3);
        return false;
      }
    },
    
    render: function() {
      this.show_from_page( this.current );
      this.height = this.container.getSize().y;
      this.width = this.container.getSize().x;
      this.scroller.addEvent('scroll:throttle(250)', this.on_scroll.bind(this));
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
    
    pages_to_show: 7,
    on_scroll: function() {
      this.show_from_page( this.current_page() );
    },
    
    reload: function() {
      for (var i = 0; i < this.all_pages.length; i++) 
        this.all_pages[i].destroy();
      
      this.all_pages.clear();
      
      this.load_data();
    },
    
    dataLoader: false,
    load_data: function(until) {
       if (!until)
         until = 1 + parseInt(this.pages_to_show / 2);
    
      this.dataLoader = new this.Request({ method: 'GET' });
      this.dataLoader.addEvent('success', this.buildFromData.bind(this));
      
      this.dataLoader.send({
        url: this.get_more_at + this.page_name + "=" + this.first_page + "&" + this.per_page_name + "=" + ( this.per_page * until )
      });
    },
    
    buildFromData: function(data) {  
      for (var i = 0; i < data.length / this.per_page; i++) {
        var container = new Element('div');
        this.all_pages.push( new this.Page(this, container, i) );
        this.all_pages[i].data = data.slice(i*this.per_page, (i+1)*this.per_page);
        this.all_pages[i].buildDOM();
        this.container.grab(container);
      }
      
      this.finishedBuilding();
    },
    
    show_from_page: function(current) {
      var start = Math.max(current - parseInt(this.pages_to_show/2), 0),
          end = current + parseInt(this.pages_to_show/2);
            
      if (end >= this.all_pages.length && this.finished)
        end = this.all_pages.length;
      
      for (var i = this.all_pages.length; i < end; i++) {
        var container = new Element('div');
        this.all_pages.push( new this.Page(this, container, i) );
        this.container.grab(container);
      }
      
      var i = 0;
      for (; i < start; i++)
        this.all_pages[i].removeDOM();
      for (; i < end; i++)
        this.all_pages[i].showDOM();
      for (; i < this.all_pages.length; i++)
        this.all_pages[i].removeDOM();
        
      this.resize();
    },
    
    resize: function() {
      for (var i = 0; i < this.all_pages.length; i++)
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
        this.owner = parent;
        this.container = container;
        this.page_number = page_number;
      },
      
      showImmediately: false,
      load: function(thenShow) {
        if (this.data)
          return this.aferLoaded(this.data);
          
        if (!this.loader) this.loader = new this.owner.Request({method: "GET"});
        
        if (thenShow)
          this.showImmediately = true;
          
        this.loader.addEvent('success', this.afterLoaded.bind(this));
        var page = this.owner.first_page + this.page_number
        
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
      
      horizontalSizing: function() {
        this.container.setStyle('display', 'inline-block');
        this.container.setStyle('width', this.container.getSize().x);
      },
      
      horizontalPlacement: function() {
        var left = 0;
        if (this.page_number != 0) {
          var container = this.owner.all_pages[this.page_number - 1].container;
          left = container.getPosition(container.getParent()).x + container.getSize().x;
        } 
        
        this.container.setStyles({
          left: left,
          position: 'absolute'
        });
      },
      
      buildDOM: function() {
        if (!this.data) { 
          this.load(true);
          return false;
        }
        
        if (!this.components) {
          this.components = [];
          
          for (var i = 0; i < this.data.length; i++) {
            this.components.push(Mobile.Component.generate(this.owner.item_component));
            this.components[i].setData(this.data[i]);
            if (!this.owner.vertical)
              this.components[i].addEvent('rendered', this.horizontalSizing.bind(this.components[i]));
          }
        }
        
        if (this.components.length == 0) {
          this.owner.finished = true;
        }
      },
      
      showDOM: function() {
        if (this.buildDOM() === false) return;
        
        this.container.setStyle('height', '');
        this.container.setStyle('width', '');
        
        if (!this.owner.vertical)
          this.horizontalPlacement();
        
        for (var i = 0; i < this.components.length; i++)
          this.components[i].renderInto(this, true);
          
        this.container.setStyle('height', this.container.getSize().y);
        
        if (!this.vertical)
          this.container.setStyle('width', this.container.getSize().x);
        
        this.start = this.owner.vertical ? this.container.getPosition().y : this.container.getPosition().x;
      },
      
      removeDOM: function() {
        for (var i = 0; i < this.components.length; i++) {
          this.components[i].destroy();
          delete this.components[i];
        }
        
        delete this.components;
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
        this.removeDOM();
        delete this.data;
        this.container.dispose();
        delete this.container;
      },
      
      serializeAndDestroy: function() {
        var serialized = this.serialize();
        this.removeDOM();
        delete this.loader;
      },
      
      resize: function() {
        if (this.container && this.container.getChildren() != 0) {
          this.container.setStyle('height', '');
          this.container.setStyle('height', this.container.getSize().y);
          
          if (!this.owner.vertical) {
            this.container.setStyle('width', '');
            this.container.setStyle('width', this.container.getSize().x);
          }
        }
      },
      
      saveSize: function() {
        this.container.setStyle('height', this.container.getSize().y);
        this.container.setStyle('width', this.container.getSize().x);
      }
    })
  })

});