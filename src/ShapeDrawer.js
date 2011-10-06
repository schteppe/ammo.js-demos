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

ShapeDrawer.prototype.target = function(t){

};

ShapeDrawer.prototype.eye = function(e){

};