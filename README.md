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
            ...
        }),
        url: "/path/to/file.html"
    });
