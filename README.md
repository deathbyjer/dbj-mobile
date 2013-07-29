DBJ Mobile
==========

DBJ Mobile is an attempt to make web apps work more like native apps in UX. It is written ontop of Mootools and comes with a built-in version of Mootools Mobile.

It has also been written in order to use the Rails assets pipeline to compile itself, however a precompiled version of the javascript will be released.

Installation
------------

To install DBJ Mobile, all you need to do is to include the necessary javascript and css file. Our recommendation is to include the css file at the top of your file and the javascript at the end of the file. 

### Entrance Page

The first page (the page you load DBJ Mobile on) will essentially become a splash screen for your appliocation, so treat it as such.


Use
---

DBJ Mobile describes a high level, component-based model for writing web applications. The idea is to keep your structure as html, your styles as css and the to break down the actual structure of the page into small pieces called components. Each component will have associated structure and function and will be able to be included in other components.

There are also special types of components, such as layouts and preloaders (preloaders coming soon), but they are both derived from the component class.

### General Structure

The general javascript structure is as such:

    - app
    --- components
    --- controllers
    --- layouts
    - configs
    - lib
    --- core
    --- more
    --- prebuilt-components
    --- startup.js.erb

Everything inside the app folder is meant to be written by the user (think Rails). The configs folder should also be changed by the user, especially routes.js.

### Components

As stated before, components have an associated HTML structure (can either be a string or a file on the server) and a class describing their use. This class will contain methods to interact with the components in different ways. 

#### Component Definition

A component definition is made up of:
- a name
- a class that extends Mobile.Component
- a url to html or an html string

It is important that the html contains no data inside of it, since it should only describe the structure of the data, not the data itself.

#### Creating a Component

To create a component, you simply need to make sure that a javascript file is included containing the following function

    Mobile.Component.create("YOUR_COMPONENT", {
        'class': new Class({
            Extends: Mobile.Component,
		    name: "YOUR_COMPONENT"
            ...
        }),
        url: "/path/to/file.html",
    });

It is important to note the repetition of the name. Eventually, this syntax will change but it's on a TODO and the name is currently required to be repeated.

#### The Component Class

When implementing your custom component class, there are certain methods that you are invited (and encouraged) to overload in order to make it work in the manner you wish.

##### build()
This method is called after the component generates DOM from the html string provided (or loaded from the url). It is recommended that you use the **this.container** object, which is the main object containing your html, as the parent in order to populate the component with whatever data is loaded. 

It is also recommended that you add any on-load javascripting (for example, attaching events to parts of the dom) at this stage of the build.

*By default, data will be loaded into this.data, but you can create whatever methods to custom load data as you see fit.*

##### render()
This method is should be used for any functionality that requires the item to be rendered (albeit transparently) on the page. This should be used primarily if there are javascript functions that need height/width data on the rendered object.

#### Example Component 

##### Code

    Mobile.Component.create("Text", {
	    url: "/path/to/file.html",
		'class': new Class({
		    Extends: Mobile.Component,
            name: "Text",
		    
			build: function() {
                this.container.getElement('.my-text').set('html', this.data.myText);			
                this.container.getElement('.my-text2').set('html', this.data.myTextTwo);			
			},
			
			render: function() {
			    this.container.getElement('.my-width').set('html', this.container.getSize().x)
			}
		})
	});
	
##### HTML

    <div class="text-component">
	    <div class="my-text"></div>
	    <div>SOME MORE TEXT: <span class="my-text2"></span></div>
	    <div>
	        And the width of this element is: <span class="my-width"></span>px
	    </div>
	</div>

### Layouts

Layouts are special components that are used to display components inside of them. Furthermore, you can swap components around inside of layouts using transitions. And on top of that, layouts can preload data through the use of loaders.

At their very base, however, they need not be anything more than a component with a special DOM element included in their HTML structure.

#### Example HTML

    <div class="basic-layout">
	    <div>This is the header!!</div>
	    <div class="mobile-frame" data-frame="main">
	    </div>
    </div>

You'll note above the class *mobile-frame* and the data element inside of it. Ignoring the data element for now, the only thing that is needed for a layout to have that a component doesn't need is this class. It describes where to load the components inside the layout.

#### Creating a Layout

Similar to how components are created, we have the function Mobile.Layout.create that will let us create a named layout. 

** It is important to note that Components and Layouts use the same namespace, so do not make a Component called Text and then a Layout called text. One will certainly override the other **

##### Structure
Layout structure is the same as Component structure, but several more attribues can be added:

- needed_components
- child_layouts
- loaders
- transition

###### needed_components
This is an array of names. All the components that the layout is sure to need in its rendering should be preloaded with the layout, and therefore included here.

###### child_layouts
What's cool about layouts is that it can actually have layouts inside of layouts. Any layouts that are needed can be included through here.

###### loaders
The loaders that were mentioned before. Every loader should be a class that implements Events and has a load() method that starts the loading process, a loaded event that gets fire upon completion and a loaded attribute that is nonexistant or false when the loader is loading and true when the loader is done or has nothing to load.

###### transition
The name of the default transition used to swap between the interior components.

#### Example Layout

##### Code

    Mobile.Layout.create("BasicLayout", {
        needed_components: ["Text"],
        child_layouts: ["AnotherLayout"],
        url: '/mobile/templates/basic_layout.html',
        'class': new Class({
	        Extends: Mobile.Layout,
	        name: "BasicLayout", 
      
	        build: function() {
	        },
	        render: function() {
	        }
	    })
    });
	
##### HTML
* Note it is the same as above *

    <div class="basic-layout">
	    <div>This is the header!!</div>
	    <div class="mobile-frame" data-frame="main">
	    </div>
    </div>

