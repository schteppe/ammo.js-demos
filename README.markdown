<a href="http://granular.cs.umu.se/ammo/Demos/RagdollDemo/three.html"><img src="http://granular.cs.umu.se/browserphysics/wp-content/uploads/2011/10/Sk%C3%A4rmbild-6.png" width="120" height="100"></a>
<a href="http://granular.cs.umu.se/ammo/Demos/BoxDemo/index.html"><img src="http://granular.cs.umu.se/ammo/Demos/BoxDemo/thumb.png" width="100" height="100"></a>
<a href="http://granular.cs.umu.se/ammo/Demos/VehicleDemo/index.html"><img src="http://granular.cs.umu.se/ammo/Demos/VehicleDemo/thumb.png" width="100" height="100"></a>
<a href="http://granular.cs.umu.se/ammo/Demos/RagdollDemo/index.html"><img src="http://granular.cs.umu.se/ammo/Demos/RagdollDemo/thumb.png" width="100" height="100"></a>

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

## Todo
* Make ShapeDrawer subclasses support more shapes
* More demos :)