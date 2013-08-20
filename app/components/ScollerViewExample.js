Mobile.Component.create('ScrollableViewExample', {
  'class': new Class({
    Extends: Mobile.Components["ScrollableView"]["class"],
    name: 'ScrollableViewExample',
    
    item_component: "Text",
    get_more_at: "/test/components",
    per_page: 20
    
  }),
  
  html: '',
  needed_components: ['Text']
});