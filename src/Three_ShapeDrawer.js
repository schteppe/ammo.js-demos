function Three_ShapeDrawer(options){
  // Extend the class
  ShapeDrawer.apply(this,arguments);

  var th = this;

  // Extend settings
  th.settings = {
    canvasId:"",
    idleFunc:function(){}
  };
  $.extend(th.settings,options);
 
  var s = th.settings;
  th.idleFunc = s.idleFunc;

  if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

  var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 1024;
  var MARGIN = 0;
  var SCREEN_WIDTH = this.SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = this.SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
  var FLOOR = 0;
  var controls, renderer;
  var container, stats;
  var NEAR = 1, FAR = 3000;
  var sceneHUD, cameraOrtho, hudMaterial;
  this.light = null;
  this.camera = this.scene = null;
  this.material = new THREE.MeshLambertMaterial( { color: 0xaaaaaa });
  var mouseX = 0, mouseY = 0;

  this.geoslices = 16; // Quality of standard shape meshes
  this.tempTransform = new Ammo.btTransform();
  this.tempQuaternion = new Ammo.btQuaternion(0, 0, 0, 0);

  var windowHalfX = window.innerWidth / 2;
  var windowHalfY = window.innerHeight / 2;

  this.meshes = []; // Meshes for simple shapes
  this.models = []; // External models
  this.wheelMeshes = []; // Wheelmeshes, array of arrays (one array for each vehicle)

  init();
  animate();

  function init() {
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    th.canvas = container;

    // SCENE CAMERA
    th.camera = new THREE.PerspectiveCamera( 25, SCREEN_WIDTH / SCREEN_HEIGHT, NEAR, FAR );
    var camera = th.camera;

    // SCENE
    th.scene = new THREE.Scene();
    th.scene.fog = new THREE.Fog( 0x000000, 10, 100 );
    //THREE.ColorUtils.adjustHSV( th.scene.fog.color, 0.02, -0.15, -0.15 );

    // LIGHTS
    var ambient = new THREE.AmbientLight( 0x444444 );
    th.scene.add( ambient );

    th.light = new THREE.SpotLight( 0xffffff );
    th.light.position.set( -100, 100, 100 );
    th.light.target.position.set(1, 0, 15 );
    th.light.castShadow = true;
    th.scene.add( th.light );

    // RENDERER
    renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    renderer.domElement.style.position = "relative";
    renderer.domElement.style.top = MARGIN + 'px';
    container.appendChild( renderer.domElement );

    //document.addEventListener('mousemove',onDocumentMouseMove);

    renderer.setClearColor( th.scene.fog.color, 1 );
    renderer.autoClear = false;

    renderer.shadowCameraNear = 1;
    renderer.shadowCameraFar = 200;
    renderer.shadowCameraFov = 15;

    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
    renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;

    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;

    th.renderer = renderer;
  }
  
  function animate() {
    requestAnimationFrame( animate );
    render();
  }

  function render(){
    /*var camera = th.camera;
    camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    camera.position.y += ( - (mouseY-windowHalfY) - camera.position.y ) * 0.05;
    if(camera.position.y<=0.1)
      camera.position.y = 0.1;
    camera.lookAt( new THREE.Vector3(th.scene.position.x,th.scene.position.y+100,th.scene.position.z) );
    */
    renderer.clear();
    renderer.render( th.scene, th.camera );
    th.idleFunc();
  }

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
$.extend(Three_ShapeDrawer.prototype,
	 ShapeDrawer.prototype);

Three_ShapeDrawer.prototype.createShape = function(shape,transform){  
  var obj = new THREE.Object3D();
  var shapeType = shape.getShapeType();
  switch(shapeType){
  case DemoApplication.prototype.BOX_SHAPE_PROXYTYPE:
    var h = shape.getHalfExtentsWithMargin();
    // Add THREE box
    var cube = new THREE.Mesh(new THREE.CubeGeometry( h.x()*2, h.y()*2, h.z()*2 ),
			  new THREE.MeshLambertMaterial( { color: 0xaaaaaa }));
    if(transform!=undefined){
      var quat = new Ammo.btQuaternion();
      var r = transform.getRotation();
      quat.setValue(r.x(),r.y(),r.z(),r.w());
      var a = quat.getAxis();
      var origin = transform.getOrigin();
      cube.position.set(origin.x(),
			origin.y(),
			origin.z());
      cube.useQuaternion = true;
      cube.quaternion.set(quat.x(),quat.y(),quat.z(),quat.w());
    }
    cube.castShadow = true;
    cube.receiveShadow = true;
    obj.add(cube);
    break;

  case DemoApplication.prototype.CYLINDER_SHAPE_PROXYTYPE:
    var radius = shape.getRadius();
    var up = shape.getUpAxis();
    var he = shape.getHalfExtentsWithoutMargin();
    var height = 1;
    switch(up){
    case 0: height=he.x(); break;
    case 1: height=he.y(); break;
    case 2: height=he.z(); break;
    }
    
    // Add THREE Cylinder
    var cyl = new THREE.Mesh (new THREE.CylinderGeometry( radius, radius, height, this.geoslices, this.geoslices, false ),
			      this.material);

    if(transform!=undefined){
      var quat = new Ammo.btQuaternion();
      var r = transform.getRotation();
      quat.setValue(r.x(),r.y(),r.z(),r.w());
      quat.normalize();
      var origin = transform.getOrigin();
      cyl.position.set(origin.x(),
		       origin.y(),
		       origin.z());
      cyl.useQuaternion = true;
      var a = quat.getAxis();
      cyl.quaternion.setFromAxisAngle(new THREE.Vector3(a.x(),
							a.y(),
							a.z()),
				      quat.getAngle());
    }
    cyl.castShadow = true;
    cyl.receiveShadow = false;
    obj.add(cyl);
    break;
  }
  return obj;
}

// Add a vehicle to the scene
  Three_ShapeDrawer.prototype.addVehicle = function(v,wheelshape,options){
  var t = new Ammo.btTransform();
  t.setIdentity();
  t.setRotation(new Ammo.btQuaternion(new Ammo.btVector3(0,0,1),Math.PI/2));
  var q = this.tempQuaternion;
  var wheels = [];
  for(var i=0;i<v.getNumWheels(); i++){
    //this.scene.findNode("shapes").add("node",jsonObject(wheelshape,t,"vehicle"+this.vehicles.length+"_wheel_"+i));
    /*
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
    */
    
    var mesh;
    if(options && options.threemeshes){
      mesh = new THREE.Object3D();
      mesh.add(options.threemeshes[i]);
    } else
      mesh = this.createShape(wheelshape,t);
    mesh.useQuaternion = true;
    wheels.push(mesh);
    this.scene.add(mesh);
    /*this.scene.findNode("rot"+"vehicle"+this.vehicles.length+"_wheel_"+i)
      .set({ angle:quat.getAngle()*180/Math.PI, x:a.x(),  y:a.y(),  z:a.z()  });    */
  }
  this.wheelMeshes.push(wheels);
  this.vehicles.push(v);
  this.wheelshapes.push(wheelshape);
};

// Adds a rigid body to the scene
Three_ShapeDrawer.prototype.add = function(body,shape,options){
  var scene = this.scene;
  this.bodies.push(body);
  this.shapes.push(shape);
  if(!shape){
    console.log("No shape in body!");
    return;
  }
  var mesh = false;
  var shapeType = shape.getShapeType();
  if(options && options.threemesh){
    mesh = new THREE.Object3D();
    mesh.add(options.threemesh);
    this.drawbody.push(true);
  } else {
    var i = this.bodies.length-1;
    switch(shapeType){
    case DemoApplication.prototype.BOX_SHAPE_PROXYTYPE:
      this.drawbody.push(true); // Draw this body
      var h = shape.getHalfExtentsWithMargin();
      // Add THREE box
      mesh = new THREE.Mesh (new THREE.CubeGeometry( h.x()*2, h.y()*2, h.z()*2 ),
			     new THREE.MeshLambertMaterial( { color: 0xaaaaaa }));
      //cube.position.set();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      break;

    case DemoApplication.prototype.SPHERE_SHAPE_PROXYTYPE:
      this.drawbody.push(true); // Draw this body
      var radius = shape.getRadius();
      // Add THREE SPHERE
      mesh = new THREE.Mesh (new THREE.SphereGeometry( radius, this.geoslices, this.geoslices),
			     this.material);
      mesh.position.set(0,2000,0);
      mesh.castShadow = true;
      mesh.receiveShadow = false;
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
      //var c = makeCylinder(radius, height, 20, 2);
      // Add THREE Cylinder
      mesh.castShadow = true;
      mesh.receiveShadow = false;
      break;

    case DemoApplication.prototype.CONE_SHAPE_PROXYTYPE:
      this.drawbody.push(true); // Draw this body
      var radius = shape.getRadius();
      var up = shape.getConeUpIndex();
      var height = shape.getHeight();
      // Add THREE cone
      mesh = new THREE.Mesh (new THREE.CylinderGeometry( radius,radius,height ),
			     new THREE.MeshLambertMaterial( { color: 0xaaaaaa }));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      break;

    case DemoApplication.prototype.STATIC_PLANE_PROXYTYPE:
      this.drawbody.push(true);
      var geometry = new THREE.PlaneGeometry( 100, 100 );
      var planeMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
      THREE.ColorUtils.adjustHSV( planeMaterial.color, 0, 0, 0.9 );
      mesh = new THREE.Object3D();
      ground = new THREE.Mesh( geometry, planeMaterial );
      ground.scale.set( 100, 100, 100 );
      ground.rotation.x=-Math.PI/2;
      ground.castShadow = false;
      ground.receiveShadow = true;

      var submesh = new THREE.Object3D();  
      submesh.useQuaternion = true;
      submesh.add(ground);

      var t = new Ammo.btTransform();
      body.getMotionState().getWorldTransform(t);
      var q = t.getRotation();
      //var a = q.getAxis();
      var plane = Ammo.castObject(shape,Ammo.btStaticPlaneShape);
      var n = plane.getPlaneNormal();
      var y = new Ammo.btVector3(0,1,0);
      var c = plane.getPlaneConstant();
      var a = n.cross(y);
      submesh.quaternion.setFromAxisAngle(new THREE.Vector3(a.x(), a.y(), a.z()),
					  Math.sqrt((n.length2()) * (y.length2())) + n.dot(y));
      submesh.position.set(0,c,0);
      mesh.add(submesh);
      break;

    case DemoApplication.prototype.CAPSULE_SHAPE_PROXYTYPE:
      // Do a cylinder + 2 spheres instead!
      this.drawbody.push(true); // Draw this body
      var radius = shape.getRadius();
      var up = shape.getUpAxis();
      //var he = shape.getHalfExtentsWithoutMargin();
      var height = shape.getHalfHeight()*2;
      // Add THREE cylinder
      mesh = new THREE.Mesh (new THREE.CylinderGeometry( radius, radius, height, this.geoslices, this.geoslices, false ),
			     this.material);

      var sphere1 = new THREE.Mesh(new THREE.SphereGeometry( radius, this.geoslices, this.geoslices), new THREE.MeshLambertMaterial( { color: 0xaaaaaa }));
      var sphere2 = new THREE.Mesh(new THREE.SphereGeometry( radius, this.geoslices, this.geoslices), new THREE.MeshLambertMaterial( { color: 0xaaaaaa }));
      sphere1.position.y = height/2;
      sphere2.position.y = -height/2;

      mesh.add(sphere1,this.material);
      mesh.add(sphere2,this.material);

      mesh.castShadow = true;
      mesh.receiveShadow = false;
      break;

    case DemoApplication.prototype.COMPOUND_SHAPE_PROXYTYPE:
      this.drawbody.push(true);
      var n = shape.getNumChildShapes();
      mesh = new THREE.Object3D();
      for(var j=0; j<n; j++){
	var childShape = shape.getChildShape(j);
	var childTransform = shape.getChildTransform(j);
	var quat = new Ammo.btQuaternion();
	var r = childTransform.getRotation();
	quat.setValue(r.x(),r.y(),r.z(),r.w());
	var a = quat.getAxis();
	var origin = childTransform.getOrigin();
	switch(childShape.getShapeType()){
	case DemoApplication.prototype.BOX_SHAPE_PROXYTYPE:
	  var castShape = Ammo.castObject(childShape,Ammo.btBoxShape);
	  var h = castShape.getHalfExtentsWithMargin();
	  var cube = new THREE.Mesh (new THREE.CubeGeometry( h.x()*2, h.y()*2, h.z()*2 ),
				     new THREE.MeshLambertMaterial( { color: 0xaaaaaa }));
	  cube.position.set(origin.x(),origin.y(),origin.z());
	  cube.useQuaternion = true;
	  cube.quaternion.set(quat.x(),quat.y(),quat.z(),quat.w());
	  cube.castShadow=true;
	  cube.receiveShadow=true;
	  mesh.add(cube);
	  break;
	}
      }
      break;

    default:
      throw "Shape proxytype "+shapeType+" not supported... yet.";
      break;
    }
  }

  if(mesh)
    scene.add( mesh );

  this.meshes.push(mesh);
};

Three_ShapeDrawer.prototype.update = function(){
  var transform = this.tempTransform;
  var quat = this.tempQuaternion;
  for(var i=0; i<this.bodies.length; i++){
    if(this.drawbody[i]){
      // Get position and rotation
      if(this.meshes[i]){
	this.bodies[i].getMotionState().getWorldTransform(transform);

	// Position
	var origin = transform.getOrigin();

	/*console.log(i,
		    origin.x(),
		    origin.y(),
		    origin.z());*/
	this.meshes[i].position.set(origin.x(),
				    origin.y(),
				    origin.z());

	// Rotation
	var r = transform.getRotation();
	quat.setValue(r.x(),r.y(),r.z(),r.w());
	var a = quat.getAxis();
	this.meshes[i].useQuaternion = true;
	this.meshes[i].quaternion.setFromAxisAngle(new THREE.Vector3(a.x(),
								     a.y(),
								     a.z()),
						   quat.getAngle());
      }
    }
  }

  // --- Update vehicles ---
  var t = this.tempTransform;
  for(var vi = 0; vi<this.vehicles.length; vi++){
    var v = this.vehicles[vi];
    t.setIdentity();
    var wheels = this.wheelMeshes[vi];
    for(var i=0;i<v.getNumWheels(); i++){
      m_vehicle.updateWheelTransform(i,true);
      var transform = m_vehicle.getWheelInfo(i).get_m_worldTransform();
      var quat = this.tempQuaternion;
      // Get position and rotation
      var origin = transform.getOrigin();
      var r = transform.getRotation();
      quat.setValue(r.x(),r.y(),r.z(),r.w());
      var a = quat.getAxis();
      wheels[i].position.set(origin.x(),origin.y(),origin.z());
      wheels[i].quaternion.setFromAxisAngle(new THREE.Vector3(a.x(),
							      a.y(),
							      a.z()),
						   quat.getAngle());
    }
  }
};

Three_ShapeDrawer.prototype.eye = function(e){
  this.camera.position.x = e.x();
  this.camera.position.y = e.y();
  this.camera.position.z = e.z();
};

Three_ShapeDrawer.prototype.target = function(e){
  this.camera.lookAt( new THREE.Vector3(e.x(),
					e.y(),
					e.z()));
};

Three_ShapeDrawer.prototype.sun = function(pos){
  //this.scene.findNode("light").set("pos",{x:pos.x(), y:pos.y(), z:pos.z()});
};

Three_ShapeDrawer.prototype.fog = function(fogOn){
  /*  if(fogOn)
    this.scene.findNode("fog").set("density",20);
  else
    this.scene.findNode("fog").set("density",0);
  */
};

// Set the HUD text
Three_ShapeDrawer.prototype.hud = function(text){
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

Three_ShapeDrawer.prototype.getScreenWidth = function(){
  return this.SCREEN_WIDTH;
};

Three_ShapeDrawer.prototype.getScreenHeight = function(){
  return this.SCREEN_HEIGHT;
};

Three_ShapeDrawer.prototype.enableShadows = function(enable){
  enable = enable ? true : false;
  this.light.castShadow = enable;
  this.renderer.shadowMapEnabled = enable;
  this.renderer.shadowMapSoft = enable;
  this.renderer.shadowMapDarkness = enable ? 0.5 : 0.0;
};
