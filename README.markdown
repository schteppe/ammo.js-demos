<a href="http://schteppe.github.com/ammo.js-demos/demos/ChessDemo/index.html"    target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/ChessDemo/thumb.png"    width="130" height="100"/></a>
<a href="http://schteppe.github.com/ammo.js-demos/demos/CarsDemo/index.html"     target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/CarsDemo/thumb.jpg"     width="130" height="100"></a>
<a href="http://schteppe.github.com/ammo.js-demos/demos/RagdollDemo/three.html"  target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/RagdollDemo/thumb.png"  width="120" height="100"></a>
<a href="http://schteppe.github.com/ammo.js-demos/demos/BoxDemo/index.html"      target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/BoxDemo/thumb.png"      width="100" height="100"></a>
<a href="http://schteppe.github.com/ammo.js-demos/demos/VehicleDemo/index.html"  target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/VehicleDemo/thumb.png"  width="100" height="100"></a>
<a href="http://schteppe.github.com/ammo.js-demos/demos/RagdollDemo/index.html"  target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/RagdollDemo/thumb.png"  width="100" height="100"></a>
<a href="http://schteppe.github.com/ammo.js-demos/demos/PendulumDemo/index.html" target="_blank"><img src="http://schteppe.github.com/ammo.js-demos/demos/PendulumDemo/thumb.png" width="100" height="100"></a>

<a href="http://schteppe.github.com/ammo.js-demos/">View all demos >></a>

This project aims to produce easy-to-use demo classes, that can be used to view physics simulations in ammo.js in any WebGL scenegraph.

There are two main classes in the framework. The first one is the _DemoApplication_ that is supposed to be extended by the user. The DemoApplication base class contains functions for mouse picking and creating rigid bodies.

The second class is _ShapeViewer_ and it is also supposed to be extended. ShapeViewer provides a simple interface toward a WebGL scenegraph and can through this interface be used by the DemoApplication.

## Code structure
* **src/** Contains code for the demo framework, which makes ammo.js collaborate with a WebGL scenegraph.
* **demos/** The actual demos in their own subfolders.
* **other/** External libs such as ammo.js, jquery, scenegraph libs

## Howto: Add a new Demo
1. Create a folder with a unique name in _demos/_, eg. _demos/MyDemo/_. 
2. Copy .js and .html files from _demos/TemplateDemo/_ into your new folder.
3. Start coding.

## Updating gh-pages
The site (gh-pages) is updated by merging the master branch into the gh-pages branch now and then. Eg. <code>git checkout gh-pages; git merge master</code>

## Todo
* Make ShapeDrawer subclasses support more shapes
* More demos :)