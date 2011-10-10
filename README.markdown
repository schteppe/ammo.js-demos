# ammo.js-demos
This project aims to produce easy-to-use demo classes, that can be used to view physics simulations in ammo.js in any WebGL scenegraph.

There are two main classes in the framework. The first one is the _DemoApplication_ that is supposed to be extended by the user. The DemoApplication base class contains functions for mouse picking and creating rigid bodies.

The second class is _ShapeViewer_ and it is also supposed to be extended. ShapeViewer provides a simple interface toward a WebGL scenegraph and can through this interface be used by the DemoApplication.

## Code structure
* _src/_ Contains code for the demo framework, which makes ammo.js collaborate with a WebGL scenegraph.
* _demos/_ The actual demos in their own subfolders.
* _other/_ External libs such as ammo.js, jquery, scenegraph libs

## Howto: Add a new Demo
Create a folder with a unique name in demos/, eg. MyDemo. Copy js and html files from some other demo into your new folder and use as a template.

## Todo
Template demo with explanations
Make SceneJS_ShapeDrawer support more shapes
Support for more WebGL scenegraphs - Three.js? Extend the ShapeDrawer class (see SceneJS_ShapeDrawer for reference)