function SceneJS_ShapeDrawer(options){
  // Extend the class
  ShapeDrawer.apply(this,arguments);

  // Extend settings
  var s = this.settings = {
    canvasId:"",
    idleFunc:function(){}
  };
  $.extend(s,options);
  var th = this;

  this.canvas = document.getElementById(s.canvasId);
  this.canvas.getContext('experimental-webgl',{antialias:false});
   
  this.tempTransform = new Ammo.btTransform();
  this.tempQuaternion = new Ammo.btQuaternion(0, 0, 0, 0);

  this.idleFunc = function(){
    th.idleFunc();
  }

  var scene = this.scene = SceneJS.createScene({
      id:"theScene",
      canvasId:s.canvasId,
      nodes: [{
	  type:"fog",
	  id:"fog",
	  mode:"exp2",
	  color: { r: 1.0, g: 1.0, b: 1.0 },
	  density: 20.0,
	  start: 1300,
	  end: 10,
	  nodes:[{
	      id:"lookat",
	      type: "lookAt",
	      eye : { x: -5, y: 6, z: 11.5 },
	      up : { y: 1.0 },
	      look: {x:0,y:0,z:0},
	      nodes: [{
		  type: "camera",
		  optics: {
		    type: "perspective",
		    fovy : 25.0,
		    aspect : document.width / document.height,
		    near : 0.10,
		    far : 300.0
		  },
		  nodes: [{
		      type: "light",
		      id:"light",
		      mode:                   "point",
		      color:                  { r: 1.0, g: 1.0, b: 1.0 },
		      diffuse:                true,
		      specular:               true,
		      pos:{ x: 10.0, y: 10.0, z: 10.0 }
		    },
  {
    type:"node",
    nodes:[{
	type: "material",
	baseColor:      { r: 0.7, g: 0.7, b: 0.7 },
	specularColor:  { r: 0.7, g: 0.7, b: 0.7 },
	emit:           0.2,
	shine:          10.0,
	nodes:[{
	    type:"node",
	    id:"shapes"
	  }]
      }]
  }]
		}]
	    }]
	    }]
	});

  scene.start({
      idleFunc:function(){
	th.idleFunc();
      }
    });

  // Setup HUD
  $("body").append("<canvas id=\"hudCanvas\"></canvas>");
  var hudcanvas = this.hudcanvas = document.getElementById("hudCanvas");
  var cx = this.hudcanvascx = hudcanvas.getContext('2d');
  var size = this.hudfontsize = 15;
  cx.font = size+"pt Arial";
  var text = this.oldHudText = "";
  var width = 200;//cx.measureText(text).width;
  hudcanvas.width = width;
  hudcanvas.height = 100;
  cx.textBaseline = "top";
  cx.fillStyle = "#FFF";
 
  // Update things
  this.update();
}

// Extend the ShapeDrawer class
$.extend(SceneJS_ShapeDrawer.prototype,
	 ShapeDrawer.prototype);

function jsonObject(shape,transform,id){
  var quat = new Ammo.btQuaternion();
  var r = transform.getRotation();
  quat.setValue(r.x(),r.y(),r.z(),r.w());
  var a = quat.getAxis();
  var origin = transform.getOrigin();
  var json = false;
  switch(shape.getShapeType()){
  case DemoApplication.prototype.CYLINDER_SHAPE_PROXYTYPE:
    shape = Ammo.castObject(shape,Ammo.btCylinderShape);
    var radius = shape.getRadius();
    var up = shape.getUpAxis();
    var he = shape.getHalfExtentsWithoutMargin();
    var height = 1;
    switch(up){
    case 0: height=he.x(); break;
    case 1: height=he.y(); break;
    case 2: height=he.z(); break;
    }
    var c = makeCylinder(radius, height, 20, 2);
    json = {
      type:"translate",
      //id:"trans",
      x:0.0,
      y:0.0,
      z:0.0,
      nodes:[{
	  type:"rotate",
	  //id:"rot"+i,
	  angle:0,
	  x:0,
	  y:0,
	  z:1,
	  nodes:[{
	      type:"rotate",
	      angle:90,
	      x:0,
	      y:1,
	      z:0,
	      nodes:[{
		  type: "geometry",
		  primitive:"triangles",
		  positions:c.positions,
		  normals:c.normals,
		  indices:c.indices
		}]
	    }]
	}]
    };
    break;

  case DemoApplication.prototype.BOX_SHAPE_PROXYTYPE:
    shape = Ammo.castObject(shape,Ammo.btBoxShape);
    var halfExtents = shape.getHalfExtentsWithMargin();
    json = {
      type:"translate",
      //id:"trans"+i,
      x:origin.x(),
      y:origin.y(),
      z:origin.z(),
      nodes:[{
	  type:"rotate",
	  //id:"rot"+i,
	  angle:quat.getAngle()*180/Math.PI,
	  x:a.x(),
	  y:a.y(),
	  z:a.z(),
	  nodes:[{
	      type:"name",
	      //id:"shape"+i,
	      nodes:[{
		  type: "cube",
		  xSize:halfExtents.getX(),
		  ySize:halfExtents.getY(),
		  zSize:halfExtents.getZ()
		}]
	    }]
	}]
    };
    break;
  }

  // Set identifyer
  if(id!=undefined){
    json.id = "trans"+id;
    json.nodes[0].id = "rot"+id;
    json.nodes[0].nodes[0].id = "shape"+id;
  }

  return json;
}

// Add a vehicle to the scene
SceneJS_ShapeDrawer.prototype.addVehicle = function(v,wheelshape){
  this.vehicles.push(v);
  this.wheelshapes.push(wheelshape);
  var t = new Ammo.btTransform();
  t.setIdentity();
  var q = this.tempQuaternion;
  t.setRotation(new Ammo.btVector3(0,0,1),Math.PI/2);
  for(var i=0;i<v.getNumWheels(); i++){
    this.scene.findNode("shapes").add("node",jsonObject(wheelshape,t,"vehicle"+this.vehicles.length+"_wheel_"+i));
    m_vehicle.updateWheelTransform(i,true);
    var transform = m_vehicle.getWheelInfo(i).get_m_worldTransform();

    var quat = this.tempQuaternion;
    // Get position and rotation
    var origin = transform.getOrigin();
    var r = transform.getRotation();
    quat.setValue(r.x(),r.y(),r.z(),r.w());
    this.scene.findNode("trans"+"vehicle"+this.vehicles.length+"_wheel_"+i)
      .set({x:origin.x(),y:origin.y(),z:origin.z()});
    var a = quat.getAxis();
    this.scene.findNode("rot"+"vehicle"+this.vehicles.length+"_wheel_"+i)
      .set({ angle:quat.getAngle()*180/Math.PI, x:a.x(),  y:a.y(),  z:a.z()  });    
  }
};

// Adds a rigid body to the scene
SceneJS_ShapeDrawer.prototype.add = function(body,shape){
  var scene = this.scene;
  this.bodies.push(body);
  this.shapes.push(shape);
  if(!shape){
    console.log("No shape in body!");
    return;
  }
  var shapeType = shape.getShapeType();
  var i = this.bodies.length-1;
  switch(shapeType){
  case DemoApplication.prototype.BOX_SHAPE_PROXYTYPE:
    this.drawbody.push(true); // Draw this body
    var halfExtents = shape.getHalfExtentsWithMargin();
    scene.findNode("shapes").add("node",{
	type:"translate",
	  id:"trans"+i,
	  x:0.0,
	  y:0.0,
	  z:0.0,
	  nodes:[{
	    type:"rotate",
	      id:"rot"+i,
	      angle:0,
	      x:0,
	      y:0,
	      z:1,
	      nodes:[{
		type:"name",
		  id:"shape"+i,
		  nodes:[{
		    type: "cube",
		      xSize:halfExtents.getX(),
		      ySize:halfExtents.getY(),
		      zSize:halfExtents.getZ()
		      }]
		  }]
	      }]
	  });
    break;
  case DemoApplication.prototype.SPHERE_SHAPE_PROXYTYPE:
    this.drawbody.push(true); // Draw this body
    var radius = shape.getRadius();
    scene.findNode("shapes").add("node",{
	type:"translate",
	  id:"trans"+i,
	  x:0.0,
	  y:0.0,
	  z:0.0,
	  nodes:[{
	    type:"rotate",
	      id:"rot"+i,
	      angle:0,
	      x:0,
	      y:0,
	      z:1,
	      nodes:[{
		type:"name",
		  id:"shape"+i,
		  nodes:[{
		    type: "sphere",
		      radius:radius,
		      rings:10,
		      slices:10
		      }]
		  }]
	      }]
	  });
    break;
  case DemoApplication.prototype.CYLINDER_SHAPE_PROXYTYPE:
    this.drawbody.push(true); // Draw this body
    var radius = shape.getRadius();
    var up = shape.getUpAxis();
    var he = shape.getHalfExtentsWithoutMargin();
    var height = 1;
    switch(up){
    case 0: height=he.x(); break;
    case 1: height=he.y(); break;
    case 2: height=he.z(); break;
    }
    var c = makeCylinder(radius, height, 20, 2);
    scene.findNode("shapes").add("node",{
	type:"translate",
	  id:"trans"+i,
	  x:0.0,
	  y:0.0,
	  z:0.0,
	  nodes:[{
	    type:"rotate",
	      id:"rot"+i,
	      angle:0,
	      x:0,
	      y:0,
	      z:1,
	      nodes:[{
		type:"rotate",
		  angle:90,
		  x:1,
		  y:0,
		  z:0,
		  nodes:[{
		    type: "geometry",
		      primitive:"triangles",
		      positions:c.positions,
		      normals:c.normals,
		      indices:c.indices
		      }]
		  }]
	      }]
	  });
    break;
  case DemoApplication.prototype.CONE_SHAPE_PROXYTYPE:
    this.drawbody.push(true); // Draw this body
    var radius = shape.getRadius();
    var up = shape.getConeUpIndex();
    var height = shape.getHeight();
    var c = makeCone(radius,height,10);
    scene.findNode("shapes").add("node",{
	type:"translate",
	  id:"trans"+i,
	  x:0.0,
	  y:0.0,
	  z:0.0,
	  nodes:[{
	    type:"rotate",
	      id:"rot"+i,
	      angle:0,
	      x:0,
	      y:0,
	      z:1,
	      nodes:[{
		type:"rotate",
		  angle:90,
		  x:1,
		  y:0,
		  z:0,
		  nodes:[{
		    type:"rotate",
		      angle:180,
		      x:0,
		      y:1,
		      z:0,
		      nodes:[{
			type: "geometry",
			  primitive:"triangles",
			  positions:c.positions,
			  normals:c.normals,
			  indices:c.indices
			  }]
		      }]
		  }]
	      }]
	  });
    break;
  case DemoApplication.prototype.STATIC_PLANE_PROXYTYPE:
    this.drawbody.push(false); // Don't draw!
    break;
  case DemoApplication.prototype.TRIANGLE_MESH_SHAPE_PROXYTYPE:
    this.drawbody.push(false); // Don't draw!
    break;
  case DemoApplication.prototype.CAPSULE_SHAPE_PROXYTYPE:
    // Do a cylinder instead!
    this.drawbody.push(true); // Draw this body
    var radius = shape.getRadius();
    var up = shape.getUpAxis();
    //var he = shape.getHalfExtentsWithoutMargin();
    var height = shape.getHalfHeight();
    /*switch(up){
    case 0: height=he.x(); break;
    case 1: height=he.y(); break;
    case 2: height=he.z(); break;
    }*/
    var c = makeCylinder(radius, height, 20, 2);
    scene.findNode("shapes").add("node",{
	type:"translate",
	  id:"trans"+i,
	  x:0.0,
	  y:0.0,
	  z:0.0,
	  nodes:[{
	    type:"rotate",
	      id:"rot"+i,
	      angle:0,
	      x:0,
	      y:0,
	      z:1,
	      nodes:[{
		type:"rotate",
		  angle:90,
		  x:1,
		  y:0,
		  z:0,
		  nodes:[{
		    type: "geometry",
		      primitive:"triangles",
		      positions:c.positions,
		      normals:c.normals,
		      indices:c.indices
		      },{
		    type:"translate",
		      z:height,
		      nodes:[{
			type:"rotate",
				angle:90,
				x:1,
				y:0,
				z:0,
				nodes:[{
			    type:"sphere",
			      radius:radius,
			      sliceDepth:0.5
			      }]
			  }]
		      },{
		    type:"translate",
		      z:-height,
		      nodes:[{
			type:"rotate",
				angle:270,
				x:1,
				y:0,
				z:0,
				nodes:[{
			    type:"sphere",
				    radius:radius,
				    sliceDepth:0.5
				    }]
				}]
		      }]
		  }]
	      }]
	  });
    break;
  case DemoApplication.prototype.COMPOUND_SHAPE_PROXYTYPE:
    this.drawbody.push(true);
    var n = shape.getNumChildShapes();
    var jsons = [];
    for(var j=0; j<n; j++){
      var childShape = shape.getChildShape(j);
      var childTransform = shape.getChildTransform(j);
      jsons.push(jsonObject(childShape,childTransform));
    }

    // Add the compound object
    scene.findNode("shapes").add("node",{
	type:"translate",
	  id:"trans"+i,
	  x:0.0,
	  y:0.0,
	  z:0.0,
	  nodes:[{
	    type:"rotate",
	      id:"rot"+i,
	      angle:0,
	      x:0,
	      y:0,
	      z:1,
	      nodes:[{
		type:"rotate",
		  angle:0,
		  x:1,
		  y:0,
		  z:0,
		  nodes:jsons
		  }]
	      }]
	  });


      /*
    var transform = this.tempTransform;
    var quat = this.tempQuaternion;
    for(var i=0; i<this.bodies.length; i++){
      if(this.drawbody[i]){
	// Get position and rotation
	var pos = [];
	this.bodies[i].getMotionState().getWorldTransform(transform);
	var origin = transform.getOrigin();
	pos[0] = origin.x();
	pos[1] = origin.y();
	pos[2] = origin.z();
	var r = transform.getRotation();
	quat.setValue(r.x(),r.y(),r.z(),r.w());
	this.scene.findNode("trans"+i).set({
	    x:pos[0],
	      y:pos[1],
	      z:pos[2]
	      });
	var a = quat.getAxis();
	this.scene.findNode("rot"+i).set({
	    angle:quat.getAngle()*180/Math.PI,
	      x:a.x(),
	      y:a.y(),
	      z:a.z()
	      });
      }
    }
      */
    break;
  default:
    throw "Shape proxytype "+shapeType+" not supported... yet.";
    break;
  }
};


// --- CYLINDER ALONG Z AXIS ---
function makeCylinder(radius,halfLength, slices, slices2){
  var normalData = [];
  var vertexPositionData = [];
  var indexData = [];
  var tri = 0;
  for(var i=0; i<slices; i++){
    var theta = i * Math.PI / slices;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    var theta = (i+0.0)*2.0*Math.PI/slices;
    var nextTheta = (i+1.0)*2.0*Math.PI/slices;

    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    var sinNextTheta = Math.sin(nextTheta);
    var cosNextTheta = Math.cos(nextTheta);

    // Top triangle
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(1.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(1.0);
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(1.0);
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(halfLength);
    indexData.push(tri);

    // front left upper triangle
    tri++;
    normalData.push(Math.cos(theta));
    normalData.push(Math.sin(theta));
    normalData.push(0.0);
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(Math.cos(nextTheta));
    normalData.push(Math.sin(nextTheta));
    normalData.push(0.0);
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(Math.cos(theta));
    normalData.push(Math.sin(theta));
    normalData.push(0.0);
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(-halfLength);
    indexData.push(tri);


    // front right bottom triangle
    tri++;
    normalData.push(Math.cos(nextTheta));
    normalData.push(Math.sin(nextTheta));
    normalData.push(0.0);
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(Math.cos(nextTheta));
    normalData.push(Math.sin(nextTheta));
    normalData.push(0.0);
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(-halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(Math.cos(theta));
    normalData.push(Math.sin(theta));
    normalData.push(0.0);
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(-halfLength);
    indexData.push(tri);


    // Bottom triangle
    tri++;
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(-1.0);
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(-halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(-1.0);
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(-halfLength);
    indexData.push(tri);

    tri++;
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(-1.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(-halfLength);
    indexData.push(tri);

    tri++;
  }
  return {positions:vertexPositionData,
      normals:normalData,
      indices:indexData};
}

// --- CYLINDER ALONG Z AXIS ---
function makeCone(radius, height, slices){
  var normalData = [];
  var vertexPositionData = [];
  var indexData = [];
  var tri = 0;
  for(var i=0; i<slices; i++){
    var theta = i * Math.PI / slices;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    var theta = (i+0.0)*2.0*Math.PI/slices;
    var nextTheta = (i+1.0)*2.0*Math.PI/slices;

    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    var sinNextTheta = Math.sin(nextTheta);
    var cosNextTheta = Math.cos(nextTheta);

    // Top
    normalData.push(Math.cos((theta+nextTheta)*0.5));
    normalData.push(Math.sin((theta+nextTheta)*0.5));
    normalData.push(Math.sin(Math.atan(radius/height)));
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(height*0.5);
    indexData.push(tri++);

    // Outer bottom 1
    normalData.push(Math.cos(theta));
    normalData.push(Math.sin(theta));
    normalData.push(Math.sin(Math.atan(radius/height)));
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(-height*0.5);
    indexData.push(tri++);

    // Outer bottom 2
    normalData.push(Math.cos(nextTheta));
    normalData.push(Math.sin(nextTheta));
    normalData.push(Math.sin(Math.atan(radius/height)));
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(-height*0.5);
    indexData.push(tri++);

    // Bottom - center
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(-1.0);
    vertexPositionData.push(radius*Math.cos(nextTheta));
    vertexPositionData.push(radius*Math.sin(nextTheta));
    vertexPositionData.push(-height*0.5);
    indexData.push(tri++);

    // Bottom - outer 1
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(-1.0);
    vertexPositionData.push(radius*Math.cos(theta));
    vertexPositionData.push(radius*Math.sin(theta));
    vertexPositionData.push(-height*0.5);
    indexData.push(tri++);

    // Bottom - outer 2
    normalData.push(0.0);
    normalData.push(0.0);
    normalData.push(-1.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(0.0);
    vertexPositionData.push(-height*0.5);
    indexData.push(tri++);
  }
  return {positions:vertexPositionData,
      normals:normalData,
      indices:indexData};
}

SceneJS_ShapeDrawer.prototype.idleFunc = function(){};

SceneJS_ShapeDrawer.prototype.update = function(){
  var transform = this.tempTransform;
  var quat = this.tempQuaternion;
  for(var i=0; i<this.bodies.length; i++){
    if(this.drawbody[i]){
      // Get position and rotation
      var pos = [];
      this.bodies[i].getMotionState().getWorldTransform(transform);
      var origin = transform.getOrigin();
      pos[0] = origin.x();
      pos[1] = origin.y();
      pos[2] = origin.z();
      var r = transform.getRotation();
      quat.setValue(r.x(),r.y(),r.z(),r.w());
      this.scene.findNode("trans"+i).set({
	  x:pos[0],
	    y:pos[1],
	    z:pos[2]
	    });
      var a = quat.getAxis();
      this.scene.findNode("rot"+i).set({
	  angle:quat.getAngle()*180/Math.PI,
	    x:a.x(),
	    y:a.y(),
	    z:a.z()
	    });
    }
  }

  // --- Update vehicles ---
  for(var vi = 0; vi<this.vehicles.length; vi++){
    var v = this.vehicles[vi];
    var t = new Ammo.btTransform();
    t.setIdentity();
    for(var i=0;i<v.getNumWheels(); i++){
      m_vehicle.updateWheelTransform(i,true);
      var transform = m_vehicle.getWheelInfo(i).get_m_worldTransform();
      var quat = this.tempQuaternion;
      // Get position and rotation
      var origin = transform.getOrigin();
      var r = transform.getRotation();
      quat.setValue(r.x(),r.y(),r.z(),r.w());
      this.scene.findNode("trans"+"vehicle"+this.vehicles.length+"_wheel_"+i)
	.set({x:origin.x(),y:origin.y(),z:origin.z()});
      var a = quat.getAxis();
      this.scene.findNode("rot"+"vehicle"+this.vehicles.length+"_wheel_"+i)
	.set({ angle:quat.getAngle()*180/Math.PI, x:a.x(),  y:a.y(),  z:a.z()  });    
    }
  }
};

SceneJS_ShapeDrawer.prototype.eye = function(e){
  this.scene.findNode("lookat").set("eye",{x:e.x(), y:e.y(), z:e.z()});
};

SceneJS_ShapeDrawer.prototype.target = function(e){
  this.scene.findNode("lookat").set("look",{x:e.x(), y:e.y(), z:e.z()});
};

SceneJS_ShapeDrawer.prototype.sun = function(pos){
  this.scene.findNode("light").set("pos",{x:pos.x(), y:pos.y(), z:pos.z()});
};

SceneJS_ShapeDrawer.prototype.fog = function(fogOn){
  if(fogOn)
    this.scene.findNode("fog").set("density",20);
  else
    this.scene.findNode("fog").set("density",0);
};

// Set the HUD text
SceneJS_ShapeDrawer.prototype.hud = function(text){
  if(text != this.oldHudText){
    var lines = text.split("\n");
    var padding = 5;
    this.hudcanvascx.clearRect(0,0,200,100);
    this.hudcanvascx.fillStyle = "#FFF";
    //this.hudcanvascx.fillRect(0,0,200,100);
    this.hudcanvascx.strokeStyle = "#FFF";
    for(var i=0; i<lines.length; i++)
      this.hudcanvascx.fillText(lines[i], padding, (i+1)*(this.hudfontsize)+padding);
    this.oldHudText = text;
  }
};

SceneJS_ShapeDrawer.prototype.getScreenWidth = function(){
  return this.canvas.width;
};

SceneJS_ShapeDrawer.prototype.getScreenHeight = function(){
  return this.canvas.height;
};