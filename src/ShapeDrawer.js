/**
 * Base class for ShapeDrawers
 */
function ShapeDrawer(options){
  var settings = {
  };
  $.extend(settings,options);
  this.bodies = [];
  this.shapes = [];
  this.drawbody = [];
  
  // Vehicles and their wheelshapes - one wheelshape per vehicle
  this.vehicles = [];
  this.wheelshapes = [];
}

/**
 * 
 */
ShapeDrawer.prototype.update = function(){
  /*
  for(var i=0; i<this.bodies.length; i++){
    var shape = this.bodies[i].getCollisionShape();
    if(!shape)
      return;
    var shapeType = shape.getShapeType();
    switch(shapeType){
    case Ammo.btBroadphaseProxy.BOX_SHAPE_PROXYTYPE:
      break;
    case Ammo.btBroadphaseProxy.TRIANGLE_SHAPE_PROXYTYPE:
      break;
    case Ammo.btBroadphaseProxy.SPHERE_SHAPE_PROXYTYPE:
      break;
    default:
      throw "Shape proxytype "+shapeType+" not supported... yet.";
      break;
    }
  }
  */
};

ShapeDrawer.prototype.add = function(body){
  this.bodies.push(body);
};

// Implement me!
ShapeDrawer.prototype.target = function(t){
  console.log("ShapeDrawer.prototype.target must be implemented!");
};
ShapeDrawer.prototype.eye = function(e){
  console.log("ShapeDrawer.prototype.eye must be implemented!");
};
ShapeDrawer.prototype.getScreenWidth = function(){
  console.log("ShapeDrawer.prototype.getScreenWidth must be implemented!");
};
ShapeDrawer.prototype.getScreenHeight = function(){
  console.log("ShapeDrawer.prototype.getScreenHeight must be implemented!");
};
ShapeDrawer.prototype.enableShadows = function(enable){
  console.log("ShapeDrawer.prototype.enableShadows must be implemented!");
};