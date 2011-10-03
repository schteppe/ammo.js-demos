DemoApplication = function(options){
  
  if(!(Ammo && ShapeDrawer && Float32Array))
    throw "Needs Ammo and ShapeDrawer!";

  var settings = this.settings = {
    shapeDrawer:new ShapeDrawer()
  };
  $.extend(settings,options);
  
  var th = this;

  // DemoApplication things
  var use6Dof = this.use6Dof = false;
  var m_dynamicsWorld =        th.m_dynamicsWorld = null;
  var m_pickConstraint =       th.m_pickConstraint = null;
  var m_cameraDistance =       th.m_cameraDistance = 15.0;
  var m_shootBoxShape =        th.m_shootBoxShape = null;
  var m_debugMode =            th.m_debugMode = 0;
  var m_ele =                  th.m_ele = 20.0;
  var m_azi =                  th.m_azi = 0.0;
  var m_cameraPosition =       th.m_cameraPosition = new Ammo.btVector3(10,0,0);
  var m_cameraTargetPosition = th.m_cameraTargetPosition = new Ammo.btVector3(0,0,0);
  var mouseButton = th.mouseButton = 0;

  // Reusable vars - using "new" is expensive and ammo.js is said to be leaking memory when doing it
  this.tempTransform = new Ammo.btTransform();
  this.tempQuaternion = new Ammo.btQuaternion(0, 0, 0, 0);
  this.tempVector3 = new Ammo.btVector3(0,0,0);

  // Interaction
  var m_mouseOldX = th.m_mouseOldX = 0;
  var m_mouseOldY = th.m_mouseOldY = 0;
  var m_mouseButtons;
  var m_modifierKeys;

  var m_scaleBottom = th.m_scaleBottom = 0.5;
  var m_scaleFactor = th.m_scaleFactor = 2;
  var m_cameraUp = th.m_cameraUp = new Ammo.btVector3(0,1,0);
  var m_forwardAxis = th.m_forwardAxis = 2;

  var m_glScreenWidth;
  var m_glScreenHeight;

  var m_frustumZNear = th.m_frustumZNear = 1;
  var m_frustumZFar = th.m_frustumZFar = 1000;

  var m_ortho = th.m_ortho = 0;

  var m_ShootBoxInitialSpeed = th.m_ShootBoxInitialSpeed = 30;
  var shootboxcounter = this.shootboxcounter = 0;
  var shootboxbodies = this.shootboxbodies = [];	

  var m_dt = th.m_dt = 1/60;
  var m_stepping = th.m_stepping = true;
  var m_singleStep = th.m_singleStep = false;
  var m_idle = th.m_idle = false;
  var m_lastKey = th.m_lastKey = 0;

  this.m_bodies = [];
  this.m_startMotionStates = [];

  var m_shapeDrawer = th.m_shapeDrawer = settings.shapeDrawer;
  var m_enableshadows = th.m_enableshadows = false;
  var m_sundirection = th.m_sundirection = new Ammo.btVector3(1000,-2000,1000);
  var m_defaultContactProcessingThreshold = th.m_defaultContactProcessingThreshold = this.BT_LARGE_FLOAT;

  // Add mouse events
  m_shapeDrawer.canvas.addEventListener('mousedown', function(e){ th.mouseFunc(e);       });
  m_shapeDrawer.canvas.addEventListener('mousemove', function(e){ th.mouseMotionFunc(e); });
  m_shapeDrawer.canvas.addEventListener('mouseup',   function(e){
      th.mouseButton = 0;
      if(th.m_pickConstraint)
	th.m_dynamicsWorld.removeConstraint(th.m_pickConstraint);
      th.m_pickConstraint = null;
    });
  m_shapeDrawer.canvas.oncontextmenu = function(){ return false; };
  
  // Key callbacks
  window.addEventListener('keydown', function(e){
      var char = String.fromCharCode(e.keyCode).toLowerCase();
      var f = th.keyboardCallbacksInternal[char];
      if(f)
	f(e,th);
	//th.keyboardCallback(e);
    });

  // get canvas info
  this.m_glScreenWidth = m_shapeDrawer.canvas.width;
  this.m_glScreenHeight = m_shapeDrawer.canvas.height;

  // Init stats
  var nstats = this.nstats = 20;
  var stepstats = this.stepstats = new Float32Array(nstats);
  var drawstats = this.drawstats = new Float32Array(nstats);
  var drawstats = this.totalstats = new Float32Array(nstats);
  var t = this.t = 0;

  // Start
  th.initPhysics();
  th.setShootBoxShape();

  // Init shapedrawer
  th.m_shapeDrawer.m_dynamicsWorld = m_dynamicsWorld;
  th.lastTotalTiming = new Date().getTime();
  th.m_shapeDrawer.idleFunc = function(){
    th.moveAndDisplay();
    th.updateHud();
    th.updateShapeDrawer();
    var t1 = new Date().getTime();
    th.totalstats[th.t%th.nstats] = 1000./(t1 - th.lastTotalTiming);
    th.lastTotalTiming = t1;
  }
  th.m_shapeDrawer.update();
  this.updateCamera();
}

DemoApplication.prototype.updateShapeDrawer = function(){
  var t0 = new Date().getTime();
  this.m_shapeDrawer.update();
  var t1 = new Date().getTime();
  this.drawstats[this.t%this.nstats] = t1-t0;

}

DemoApplication.prototype.getDynamicsWorld = function(){
  return this.m_dynamicsWorld;
};

DemoApplication.prototype.updateHud = function(){
  if(this.m_debugMode & this.DBG_NoHelpText){
    if(this.t%this.nstats==0){
      var phys = parseInt(100*avg(this.stepstats))/100;
      var draw = parseInt(100*avg(this.drawstats))/100;
      var total = parseInt(100*avg(this.totalstats))/100;
      this.m_shapeDrawer.hud("FPS: "+total+"\n"+
			     "Physics: "+phys+" ms\n"+
			     "Update scenegraph: "+draw+" ms\n");
    }
  } else {
    this.m_shapeDrawer.hud("");
  }
};

function avg(v){
  s = 0.0;
  for(var i=0; i<v.length; i++)
    s += v[i];
  return s/v.length;
}

// Override me!
DemoApplication.prototype.initPhysics = function(){};

DemoApplication.prototype.BT_LARGE_FLOAT = 1000000.0;

DemoApplication.prototype.setDrawClusters = function(drawClusters){
  // Todo
};

DemoApplication.prototype.overrideWebGLShapeDrawer = function(shapeDrawer){
  var bodies;
  if(this.shapeDrawer)
    bodies = this.shapeDrawer.bodies;
  this.shapeDrawer = shapeDrawer;
  this.shapeDrawer.update();
};
	
DemoApplication.prototype.setOrthographicProjection = function(){
  // TODO
};

DemoApplication.prototype.resetPerspectiveProjection = function(){
  // TODO
};
	
DemoApplication.prototype.setTexturing = function(enable){
  return this.m_shapeDrawer.enableTexture(enable);
};

DemoApplication.prototype.setShadows = function(enable){
  var p = m_enableshadows;
  this.m_enableshadows = enable;
  return (p);
};

DemoApplication.prototype.getTexturing = function(){
  return this.m_shapeDrawer.hasTextureEnabled();
};

DemoApplication.prototype.getShadows = function(){
  return this.m_enableshadows;
};

DemoApplication.prototype.getDebugMode = function(){
  return this.m_debugMode;
};
	
DemoApplication.prototype.setDebugMode = function(mode){
  // TODO
};
	
DemoApplication.prototype.setAzi = function(azi){
  this.m_azi = azi;
};

DemoApplication.prototype.setCameraUp = function(camUp){
  this.m_cameraUp = camUp;
};

DemoApplication.prototype.setCameraForwardAxis = function(axis){
  this.m_forwardAxis = axis;
};

DemoApplication.prototype.myinit = function(){
  // Todo
  // Settings for light etc
};

DemoApplication.prototype.toggleIdle = function(){
  this.m_idle = !this.m_idle;
};
DemoApplication.prototype.SIMD_EPSILON = 0.01;	
DemoApplication.prototype.updateCamera = function(){

  var rele = this.m_ele * (0.01745329251994329547);// rads per deg
  var razi = this.m_azi * (0.01745329251994329547);// rads per deg

  var rot = this.tempQuaternion;
  rot.setRotation(this.tVec(this.m_cameraUp.x(),
			    this.m_cameraUp.y(),
			    this.m_cameraUp.z()),
		  razi);

  var eyePos = this.tempVector3;
  switch(this.m_forwardAxis){
  case 0:
    eyePos.setX(-this.m_cameraDistance);
    break;
  case 1:
    eyePos.setY(-this.m_cameraDistance);
    break;
  case 2:
    eyePos.setZ(-this.m_cameraDistance);
    break;
  }

  var forward = new Ammo.btVector3(eyePos.x(),eyePos.y(),eyePos.z());
  forward.normalize();
  if(forward.length2() < this.SIMD_EPSILON)
    forward.setValue(1.0,0.0,0.0);
  var right = this.m_cameraUp.cross(forward);
  var roll = new Ammo.btQuaternion(right, -rele);
  roll.normalize();

  // Matrix-vector multiply
  function vmul(m,v){
    var r1 = m.getRow(0);
    var r2 = m.getRow(1);
    var r3 = m.getRow(2);
    var s1 = r1.x()*v.x() + r1.y()*v.y() + r1.z()*v.z();
    var s2 = r2.x()*v.x() + r2.y()*v.y() + r2.z()*v.z();
    var s3 = r3.x()*v.x() + r3.y()*v.y() + r3.z()*v.z();
    return new Ammo.btVector3(s1,
			      s2,
			      s3);
  }

  var rollmat = new Ammo.btMatrix3x3(roll);
  var rotmat = new Ammo.btMatrix3x3(rot);
  eyePos = vmul(rotmat,vmul(rollmat,eyePos));
  //console.log("new eyePos=("+eyePos.x()+","+eyePos.y()+","+eyePos.z()+")");
  //console.log("camTargetPos=("+this.m_cameraTargetPosition.x()+","+this.m_cameraTargetPosition.y()+","+this.m_cameraTargetPosition.z()+")");

  this.m_cameraPosition.setX(eyePos.x());
  this.m_cameraPosition.setY(eyePos.y());
  this.m_cameraPosition.setZ(eyePos.z());
  this.m_cameraPosition.op_add(this.m_cameraTargetPosition);// = (new Ammo.btVector3(this.m_cameraPosition)).op_add(this.m_cameraTargetPosition);

  // Set renderer things
  this.m_shapeDrawer.eye(this.m_cameraPosition);
  this.m_shapeDrawer.target(this.m_cameraTargetPosition);
  this.m_shapeDrawer.sun(this.tVec(-this.m_sundirection.x(),
				   -this.m_sundirection.y(),
				   -this.m_sundirection.z()));
};

DemoApplication.prototype.getCameraPosition = function(){
  return this.m_cameraPosition;
};

DemoApplication.prototype.getCameraTargetPosition = function(){
  return this.m_cameraTargetPosition;
};

DemoApplication.prototype.getDeltaTimeMicroseconds = function(){
  var t = new Date();
  var dt = 0.0;
  if(this.m_clock)
    dt = (t.getTime() - this.m_clock.getTime())*1000;
  this.m_clock = t;
  return dt;
};

DemoApplication.prototype.setFrustumZPlanes = function(zNear, zFar){
  this.m_frustumZNear = zNear;
  this.m_frustumZFar = zFar;
};
	
DemoApplication.USE_BT_CLOCK = true;

DemoApplication.prototype.getCameraDistance = function(){
  return this.m_cameraDistance;
};

DemoApplication.prototype.setCameraDistance = function(dist){
  this.cameraDistance = dist;
};

DemoApplication.prototype.moveAndDisplay = function(){
  var t0 = new Date().getTime();
  if (!this.m_idle){
    this.clientMoveAndDisplay();
  } else
    this.displayCallback();
  var t1 = new Date().getTime();
  this.stepstats[this.t%this.nstats] = t1-t0;
  this.t++;
};

DemoApplication.prototype.clientMoveAndDisplay = function(){
  // Override me!
};

DemoApplication.prototype.clientResetScene = function(){
  var gNumClampedCcdMotions = 0;
  var numObjects = 0;

  if(this.m_dynamicsWorld){
    var numObjects = this.m_bodies.length;//this.m_dynamicsWorld.getNumCollisionObjects();
	
    ///create a copy of the array, not a reference!
    //var copyArray = this.m_dynamicsWorld.getCollisionObjectArray();
    for(var i=0; i<numObjects; i++){
      //console.log(copyArray);
      //var colObj = copyArray[i];
      var body = this.m_bodies[i];//colObj;
      if(body){
	if(body.getMotionState()){
	  var myMotionState = this.m_startMotionStates[i];//body.getMotionState();
	  myMotionState.set_m_graphicsWorldTrans(myMotionState.get_m_startWorldTrans());
	  body.setCenterOfMassTransform( myMotionState.get_m_graphicsWorldTrans() );
	  body.setInterpolationWorldTransform( myMotionState.get_m_startWorldTrans() );
	  //body.forceActivationState(ACTIVE_TAG);
	  body.activate();
	  /*
	  colObj.activate();
	  */
	  body.setDeactivationTime(0);
	  //colObj.setActivationState(WANTS_DEACTIVATION);
	}
	//removed cached contact points (this is not necessary if all objects have been removed from the dynamics world)
	if(this.m_dynamicsWorld.getBroadphase().getOverlappingPairCache())
	  this.m_dynamicsWorld
	    .getBroadphase()
	    .getOverlappingPairCache()
	    .cleanProxyFromPairs(body.getBroadphaseHandle(),
				 this.getDynamicsWorld().getDispatcher());
	
	//body = colObj;
	if (body && !body.isStaticObject()){
	  /*
	  colObj.setLinearVelocity(this.tVec(0,0,0));
	  colObj.setAngularVelocity(this.tVec(0,0,0));
	  */
	  body.setLinearVelocity(this.tVec(0,0,0));
	  body.setAngularVelocity(this.tVec(0,0,0));
	}
      }  
    }
    
    ///reset some internal cached data in the broadphase
    this.m_dynamicsWorld.getBroadphase().resetPool(this.getDynamicsWorld().getDispatcher());
    this.m_dynamicsWorld.getConstraintSolver().reset();
  }
};

DemoApplication.prototype.setShootBoxShape = function(shapeType){
  switch(shapeType){
  case 'box':      this.m_shootBoxShape = new Ammo.btBoxShape(this.tVec(.5,.5,.5)); break;
  case 'sphere':   this.m_shootBoxShape = new Ammo.btSphereShape(.5); break;
  case 'cylinder': this.m_shootBoxShape = new Ammo.btCylinderShape(this.tVec(.5,.5,.5)); break;
  case 'cone':     this.m_shootBoxShape = new Ammo.btConeShape(.5,1); break;
  default: this.setShootBoxShape('sphere'); break;
  }
};

// To save some memory leaking
DemoApplication.prototype.tVec = function(x,y,z){
  this.tempVector3.setValue(x,y,z);
  return this.tempVector3;
}

// To save some memory leaking
  DemoApplication.prototype.tQuat = function(x,y,z,w){
    this.tempQuaternion.setValue(x,y,z,w);
  return this.tempQuaternion;
}

// Vec3 destination
DemoApplication.prototype.shootBox = function(destination){
  if(this.m_dynamicsWorld){
    var mass = 1.0;
    var startTransform = this.tempTransform;
    startTransform.setIdentity();
    var camPos = this.getCameraPosition();
    startTransform.setOrigin(this.tVec(100,
				       100,
				       100));
    var body;
    if(this.shootboxbodies.length < this.MAX_SHOOTBOXES){
      body = this.localCreateRigidBody(mass, startTransform, this.m_shootBoxShape);
      this.shootboxbodies.push(body);
    } else {
      body = this.shootboxbodies[this.shootboxcounter%this.shootboxbodies.length];
    }
    body.setLinearFactor(this.tVec(1,1,1));
    
    var linVel = this.tVec(destination.x()-camPos.x(),
			   destination.y()-camPos.y(),
			   destination.z()-camPos.z());
    linVel.normalize();
    linVel.op_mul(this.m_ShootBoxInitialSpeed);
    body.setLinearVelocity(linVel);

    body.getWorldTransform().setOrigin(camPos);
    body.getWorldTransform().setRotation(this.tQuat(0,0,0,1));
    body.setAngularVelocity(this.tVec(0,0,0));
    body.setCcdMotionThreshold(1.0);
    body.setCcdSweptSphereRadius(0.2);

    this.shootboxcounter++;
  }
};

function printv(v,name){
  console.log((name?name+": ":"")+v.x()+","+v.y()+","+v.z());
}

// int x, int y
DemoApplication.prototype.getRayTo = function(x, y){
  if(this.m_ortho){
    var aspect; // Scalar
    var extents; // vec3
    if(this.m_glScreenWidth > this.m_glScreenHeight){
      aspect = this.m_glScreenWidth / this.m_glScreenHeight;
      extents.setValue(aspect * 1.0, 1.0, 0.0);
    } else {
      aspect = this.m_glScreenHeight / this.m_glScreenWidth;
      extents.setValue(1.0, aspect*1.0, 0);
    }
		
    extents.op_mul(this.m_cameraDistance);

    var lower = new Ammo.btVector3(this.m_cameraTargetPosition).op_sub(extents); //vec
    var upper = new Ammo.btVector3(this.m_cameraTargetPosition).op_add(extents); //vec

    var u = x / this.m_glScreenWidth;
    var v = (this.m_glScreenHeight - y) / this.m_glScreenHeight;
		
    var p = new Ammo.btVector3(0,0,0);
    p.setValue((1.0 - u) * lower.getX() + u * upper.getX(),
	       (1.0 - v) * lower.getY() + v * upper.getY(),
	       this.m_cameraTargetPosition.getZ());
    return p;
  }

  var top = 1.0;
  var bottom = 0.12; // 0.0 ???
  var nearPlane = 1.0;
  var tanFov = (top-bottom)*0.5 / nearPlane;
  var fov = 2.0 * Math.atan(tanFov); // 2.0 ???

  var rayFrom = [this.getCameraPosition().x(),
		 this.getCameraPosition().y(),
		 this.getCameraPosition().z()];
  var rayForward = new Ammo.btVector3(this.getCameraTargetPosition().x() - this.getCameraPosition().x(),
				      this.getCameraTargetPosition().y() - this.getCameraPosition().y(),
				      this.getCameraTargetPosition().z() - this.getCameraPosition().z());

  var farPlane = 300.0;
  rayForward.normalize();
  rayForward.op_mul(farPlane);

  var rightOffset;
  var vertical = new Ammo.btVector3(this.m_cameraUp.x(),
				    this.m_cameraUp.y(),
				    this.m_cameraUp.z());
  
  var cr1 = rayForward.cross(vertical);
  var hor = new Ammo.btVector3(cr1.x(),
			       cr1.y(),
			       cr1.z());
  hor.normalize();
  var cr = hor.cross(rayForward);
  vertical.setValue(cr.x(),
		    cr.y(),
		    cr.z());
  vertical.normalize();

  var tanfov = Math.tan(0.5*fov);

  hor.op_mul(farPlane * tanfov);
  vertical.op_mul(farPlane * tanfov);

  var aspect;
	
  if(this.m_glScreenWidth > this.m_glScreenHeight){
    aspect = (this.m_glScreenWidth+0.0) / (0.0+this.m_glScreenHeight);  
    hor.op_mul(aspect);
  } else {
    aspect = this.m_glScreenHeight / this.m_glScreenWidth;
    vertical.op_mul(aspect);
  }

  var rayToCenter = new Ammo.btVector3(rayFrom[0],
				       rayFrom[1],
				       rayFrom[2]).op_add(rayForward);

  var dHor = new Ammo.btVector3(hor.x(),
				hor.y(),
				hor.z()).op_mul(1.0/(0.0+this.m_glScreenWidth));
  var dVert = new Ammo.btVector3(vertical.x(),
				 vertical.y(),
				 vertical.z()).op_mul(1.0/(0.0+this.m_glScreenHeight));

  var rayTo = new Ammo.btVector3(rayToCenter.x(),
				 rayToCenter.y(),
				 rayToCenter.z()).op_sub(hor.op_mul(0.5).op_add(vertical.op_mul(-0.49))); // -0.5 on last?
  rayTo.op_add(this.tVec(dHor.x()*x,
			 dHor.y()*x,
			 dHor.z()*x));
  rayTo.op_sub(this.tVec(dVert.x()*y,
			 dVert.y()*y,
			 dVert.z()*y));
  return rayTo;
};

DemoApplication.prototype.mousePickClamping = 30.0;

DemoApplication.prototype.BOX_SHAPE_PROXYTYPE = 0;
DemoApplication.prototype.TRIANGLE_SHAPE_PROXYTYPE = 1;
DemoApplication.prototype.TETRAHEDRAL_SHAPE_PROXYTYPE = 2;
DemoApplication.prototype.CONVEX_TRIANGLEMESH_SHAPE_PROXYTYPE = 3;
DemoApplication.prototype.CONVEX_HULL_SHAPE_PROXYTYPE = 4;
DemoApplication.prototype.CONVEX_POINT_CLOUD_SHAPE_PROXYTYPE = 5;
DemoApplication.prototype.CUSTOM_POLYHEDRAL_SHAPE_TYPE = 6;
DemoApplication.prototype.IMPLICIT_CONVEX_SHAPES_START_HERE = 7;
DemoApplication.prototype.SPHERE_SHAPE_PROXYTYPE = 8;
DemoApplication.prototype.MULTI_SPHERE_SHAPE_PROXYTYPE = 9;
DemoApplication.prototype.CAPSULE_SHAPE_PROXYTYPE = 10;
DemoApplication.prototype.CONE_SHAPE_PROXYTYPE = 11;
DemoApplication.prototype.CONVEX_SHAPE_PROXYTYPE = 12;
DemoApplication.prototype.CYLINDER_SHAPE_PROXYTYPE = 13;
DemoApplication.prototype.UNIFORM_SCALING_SHAPE_PROXYTYPE = 14;
DemoApplication.prototype.MINKOWSKI_SUM_SHAPE_PROXYTYPE = 15;
DemoApplication.prototype.MINKOWSKI_DIFFERENCE_SHAPE_PROXYTYPE = 16;
DemoApplication.prototype.BOX_2D_SHAPE_PROXYTYPE = 17;
DemoApplication.prototype.CONVEX_2D_SHAPE_PROXYTYPE = 18;
DemoApplication.prototype.CUSTOM_CONVEX_SHAPE_TYPE = 19;
DemoApplication.prototype.CONCAVE_SHAPES_START_HERE = 20;
DemoApplication.prototype.TRIANGLE_MESH_SHAPE_PROXYTYPE = 21;
DemoApplication.prototype.SCALED_TRIANGLE_MESH_SHAPE_PROXYTYPE = 22;
DemoApplication.prototype.FAST_CONCAVE_MESH_PROXYTYPE = 23;
DemoApplication.prototype.TERRAIN_SHAPE_PROXYTYPE = 24;
DemoApplication.prototype.GIMPACT_SHAPE_PROXYTYPE = 25;
DemoApplication.prototype.MULTIMATERIAL_TRIANGLE_MESH_PROXYTYPE = 26;
DemoApplication.prototype.EMPTY_SHAPE_PROXYTYPE = 27;
DemoApplication.prototype.STATIC_PLANE_PROXYTYPE = 28;
DemoApplication.prototype.CUSTOM_CONCAVE_SHAPE_TYPE = 29;
DemoApplication.prototype.CONCAVE_SHAPES_END_HERE = 30;
DemoApplication.prototype.COMPOUND_SHAPE_PROXYTYPE = 31;
DemoApplication.prototype.SOFTBODY_SHAPE_PROXYTYPE = 32;
DemoApplication.prototype.HFFLUID_SHAPE_PROXYTYPE = 33;
DemoApplication.prototype.HFFLUID_BUOYANT_CONVEX_SHAPE_PROXYTYPE = 34;
DemoApplication.prototype.INVALID_SHAPE_PROXYTYPE = 35;
DemoApplication.prototype.MAX_BROADPHASE_COLLISION_TYPES = 36;

DemoApplication.prototype.MAX_SHOOTBOXES = 10;

// float mass, const btTransform& startTransform,btCollisionShape* shape
DemoApplication.prototype.localCreateRigidBody = function(mass, startTransform, shape){
  if((!shape || shape.getShapeType() == this.INVALID_SHAPE_PROXYTYPE))
    return null;

  // rigidbody is dynamic if and only if mass is non zero, otherwise static
  var isDynamic = (mass != 0.0);
  
  var localInertia = new Ammo.btVector3(0,0,0);
  if(isDynamic)
    shape.calculateLocalInertia(mass,localInertia);
  
  var myMotionState = new Ammo.btDefaultMotionState(startTransform);
  var cInfo = new Ammo.btRigidBodyConstructionInfo(mass,myMotionState,shape,localInertia);
  var body = new Ammo.btRigidBody(cInfo);
  body.setLinearVelocity(new btVector3(0,0,0));
  body.setAngularVelocity(new btVector3(0,0,0));
  body.setContactProcessingThreshold(this.m_defaultContactProcessingThreshold);
  this.m_dynamicsWorld.addRigidBody(body);
  this.m_shapeDrawer.add(body,shape);
  this.m_bodies.push(body);
  this.m_startMotionStates.push(myMotionState);
  return body;
};

DemoApplication.prototype.DBG_NoHelpText = 1;

DemoApplication.prototype.keyboardCallbacksInternal = {
  q: function(e,da){ console.log("Quit? You can't quit!"); },
  l: function(e,da){ da.stepLeft(); },
  r: function(e,da){ da.stepRight(); },
  f: function(e,da){ da.stepFront(); },
  b: function(e,da){ da.stepBack(); },
  z: function(e,da){ da.zoomIn(); },
  x: function(e,da){ da.zoomOut(); },
  i: function(e,da){ da.toggleIdle(); },
  g: function(e,da){ da.m_enableshadows=!da.m_enableshadows; },
  u: function(e,da){ da.m_shapeDrawer.enableTexture(!da.m_shapeDrawer.enableTexture(false)); },
  h: function(e,da){
    // Toggle profiling HUD
    //da.m_shapeDrawer.hud("Hello!");
    if(da.m_debugMode & da.DBG_NoHelpText)
      da.m_debugMode = da.m_debugMode & (~da.DBG_NoHelpText);
    else
      da.m_debugMode |= da.DBG_NoHelpText;
  },
  ' ': function(e,da){
    da.clientResetScene();
  },


  /*
  w: function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawWireframe)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawWireframe);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawWireframe;
  },

  p: function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_ProfileTimings)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_ProfileTimings);
    else
      m_debugMode |= btIDebugDraw::DBG_ProfileTimings;
  },

  '=':function(e,da){
    // Screenshot?
  },

  m : function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_EnableSatComparison)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_EnableSatComparison);
    else
      m_debugMode |= btIDebugDraw::DBG_EnableSatComparison;
      
  },
  n : function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DisableBulletLCP)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DisableBulletLCP);
    else
      m_debugMode |= btIDebugDraw::DBG_DisableBulletLCP;
  },

  t :  function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawText)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawText);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawText;
  },
  y:		 function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawFeaturesText)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawFeaturesText);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawFeaturesText;
  },
  a:	 function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawAabb)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawAabb);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawAabb;
  },
  c :  function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawContactPoints)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawContactPoints);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawContactPoints;
  },
  C :  function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawConstraints)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawConstraints);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawConstraints;
  },
  L :  function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_DrawConstraintLimits)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_DrawConstraintLimits);
    else
      m_debugMode |= btIDebugDraw::DBG_DrawConstraintLimits;
  },

  d :  function(e,da){
    if (m_debugMode & btIDebugDraw::DBG_NoDeactivation)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_NoDeactivation);
    else
      m_debugMode |= btIDebugDraw::DBG_NoDeactivation;
    if (m_debugMode & btIDebugDraw::DBG_NoDeactivation)
      {
	gDisableDeactivation = true;
      } else
      {
	gDisableDeactivation = false;
      }
  },
  o : function(e,da){
    m_ortho = !m_ortho;//m_stepping = !m_stepping;
  },
  s :  function(e,da){clientMoveAndDisplay(); },
  '1' : function(e,da){
      if (m_debugMode & btIDebugDraw::DBG_EnableCCD)
      m_debugMode = m_debugMode & (~btIDebugDraw::DBG_EnableCCD);
      else
      m_debugMode |= btIDebugDraw::DBG_EnableCCD;
  },

  '.': function(e,da){
    this.shootBox(this.m_cameraTargetPosition); //this.getRayTo(x,y);
  },

  '+': function(e,da){
    this.m_ShootBoxInitialSpeed += 10.0;
  },
  '-': function(e,da){
    this.m_ShootBoxInitialSpeed -= 10.0;
  },
  */ 
  
};

// Extends the keyboard callbacks
// k is an object on the JSON format with buttons as keys and callbacks as values
// Example that sets the '+' button callback:
// keyboardCallback({'+':function(event,demoapplication){...}})
DemoApplication.prototype.keyboardCallback = function(k){
  $.extend(this.keyboardCallbacksInternal,k);
};

DemoApplication.prototype.keyboardUpCallback = function(key, x, y){};
DemoApplication.prototype.specialKeyboard = function(key, x, y){};
DemoApplication.prototype.specialKeyboardUp = function(key, x, y){};

// int w, int h
DemoApplication.prototype.reshape = function(w, h){
  this.m_webglScreenWidth = w;
  this.m_webglScreenHeight = h;
  // TODO: THE REST
  this.updateCamera();
};

// int button, int state, int x, int y
DemoApplication.prototype.mouseFunc = function(event){ // button, state, x, y  
  var button = this.mouseButton = event.which;
  var x = event.clientX///this.m_glScreenWidth;
  var y = event.clientY///this.m_glScreenHeight;

  /*
  if(this.state == 0)
    this.m_mouseButtons |= 1<<button;
  else
    this.m_mouseButtons = 0;
  */

  this.m_mouseOldX = x;
  this.m_mouseOldY = y;
  
  /*
    this.updateModifierKeys();
    if ((this.m_modifierKeys& BT_ACTIVE_ALT) && (state==0))
    return;
  */

  var rayTo = this.getRayTo(x, y);

  switch(button){
  case 2:
    this.shootBox(this.getRayTo(x,y));
    break;
  case 0:
    if(this.state==0){
      //apply an impulse
      /*
      if(this.m_dynamicsWorld){
	btCollisionWorld::ClosestRayResultCallback rayCallback(m_cameraPosition,rayTo);
	m_dynamicsWorld.rayTest(m_cameraPosition,rayTo,rayCallback);
	if(rayCallback.hasHit()){
	  var body = btRigidBody::upcast(rayCallback.m_collisionObject);
	  if(body){
	    body.setActivationState(ACTIVE_TAG);
	    btVector3 impulse = rayTo;
	    impulse.normalize();
	    float impulseStrength = 10.f;
	    impulse *= impulseStrength;
	    btVector3 relPos = rayCallback.m_hitPointWorld - body.getCenterOfMassPosition();
	    body.applyImpulse(impulse,relPos);
	  }
	}
      */
      }
      break;	
    case 1:
      // add a point to point constraint for picking
      if(!this.isIdle() && this.m_dynamicsWorld){
	var rayFrom = new Ammo.btVector3(0,0,0);
	if(this.m_ortho){
	  rayFrom = rayTo;
	  rayFrom.setZ(-100.0);
	} else
	  rayFrom.setValue(this.m_cameraPosition.x(),
			   this.m_cameraPosition.y(),
			   this.m_cameraPosition.z());
	
	var rayCallback = new Ammo.ClosestRayResultCallback(rayFrom,rayTo);
	this.m_dynamicsWorld.rayTest(rayFrom,rayTo,rayCallback);
	if(rayCallback.hasHit()){
	  var body = rayCallback.get_m_collisionObject();
	  if(body){
	    // other exclusions?
	    if(!(body.isStaticObject() || body.isKinematicObject())){
	      pickedBody = body = Ammo.btRigidBody.prototype.upcast(body);
	      body.activate();
	      
	      var pickPos = rayCallback.get_m_hitPointWorld();
	      
	      var localPivot = body.getCenterOfMassTransform().inverse().op_mul(pickPos);
	      
	      if(this.use6Dof){
		var tr = new Ammo.btTransform();
		tr.setIdentity();
		tr.setOrigin(localPivot);
		dof6 = new Ammo.btGeneric6DofConstraint(body, tr, false);
		dof6.setLinearLowerLimit(btVector3(0,0,0));
		dof6.setLinearUpperLimit(btVector3(0,0,0));
		dof6.setAngularLowerLimit(btVector3(0,0,0));
		dof6.setAngularUpperLimit(btVector3(0,0,0));

		this.m_dynamicsWorld.addConstraint(dof6);
		this.m_pickConstraint = dof6;

		dof6.setParam(BT_CONSTRAINT_STOP_CFM,0.8,0);
		dof6.setParam(BT_CONSTRAINT_STOP_CFM,0.8,1);
		dof6.setParam(BT_CONSTRAINT_STOP_CFM,0.8,2);
		dof6.setParam(BT_CONSTRAINT_STOP_CFM,0.8,3);
		dof6.setParam(BT_CONSTRAINT_STOP_CFM,0.8,4);
		dof6.setParam(BT_CONSTRAINT_STOP_CFM,0.8,5);

		dof6.setParam(BT_CONSTRAINT_STOP_ERP,0.1,0);
		dof6.setParam(BT_CONSTRAINT_STOP_ERP,0.1,1);
		dof6.setParam(BT_CONSTRAINT_STOP_ERP,0.1,2);
		dof6.setParam(BT_CONSTRAINT_STOP_ERP,0.1,3);
		dof6.setParam(BT_CONSTRAINT_STOP_ERP,0.1,4);
		dof6.setParam(BT_CONSTRAINT_STOP_ERP,0.1,5);
	      } else {
		var p2p = new Ammo.btPoint2PointConstraint(body,localPivot);
		this.m_dynamicsWorld.addConstraint(p2p);
		this.m_pickConstraint = p2p;
		p2p.get_m_setting().set_m_impulseClamp(this.mousePickClamping);
		//very weak constraint for picking
		p2p.get_m_setting().set_m_tau(0.001);
		/*
		  p2p.setParam(BT_CONSTRAINT_CFM,0.8,0);
		  p2p.setParam(BT_CONSTRAINT_CFM,0.8,1);
		  p2p.setParam(BT_CONSTRAINT_CFM,0.8,2);
		  p2p.setParam(BT_CONSTRAINT_ERP,0.1,0);
		  p2p.setParam(BT_CONSTRAINT_ERP,0.1,1);
		  p2p.setParam(BT_CONSTRAINT_ERP,0.1,2);
		*/
		    
	      }
	      //this.use6Dof = !this.use6Dof;
		  
	      //save mouse position for dragging
	      gOldPickingPos = rayTo;
	      gHitPos = pickPos;
		  
	      gOldPickingDist  = (pickPos.op_sub(rayFrom)).length();
	    }
	  }
	}
	
      } else {
	if(this.m_pickConstraint && this.m_dynamicsWorld){
	  this.m_dynamicsWorld.removeConstraint(this.m_pickConstraint);
	  this.m_pickConstraint = 0;
	  pickedBody.forceActivationState(ACTIVE_TAG);
	  pickedBody.setDeactivationTime( 0.0 );
	  pickedBody = 0;
	}
      }
      break;
  default:
    break;
  }
};

DemoApplication.prototype.mouseMotionFunc = function(event){
  var x = event.clientX;
  var y = event.clientY;
  if(this.m_pickConstraint){
    // move the constraint pivot
    if(this.m_pickConstraint.getConstraintType() == this.D6_CONSTRAINT_TYPE){
      var pickCon = this.m_pickConstraint;
      if(pickCon){
	// keep it at the same picking distance
	var newRayTo;
	newRayTo = this.getRayTo(x,y);
	var rayFrom;
	var oldPivotInB = pickCon.getFrameOffsetA().getOrigin();
	var newPivotB;
	if(this.m_ortho){
	  newPivotB = oldPivotInB;
	  newPivotB.setX(newRayTo.getX());
	  newPivotB.setY(newRayTo.getY());
	} else {
	  rayFrom = this.m_cameraPosition;
	  var dir = newRayTo-rayFrom;
	  dir.normalize();
	  dir *= gOldPickingDist;  
	  newPivotB = rayFrom + dir;
	}
	pickCon.getFrameOffsetA().setOrigin(newPivotB);
      }
      
    } else {
      var pickCon = this.m_pickConstraint;
      if(pickCon){
	//keep it at the same picking distance
	var newRayTo = this.getRayTo(x,y);
	var rayFrom;
	var oldPivotInB = pickCon.getPivotInB();
	var newPivotB;
	if(this.m_ortho){
	  newPivotB = oldPivotInB;
	  newPivotB.setX(newRayTo.getX());
	  newPivotB.setY(newRayTo.getY());
	} else {
	  rayFrom = this.m_cameraPosition;
	  var dir = newRayTo.op_sub(rayFrom);
	  dir.normalize();
	  dir.op_mul(gOldPickingDist);
	  newPivotB = this.tVec(rayFrom.x() + dir.x(),
				rayFrom.y() + dir.y(),
				rayFrom.z() + dir.z());
	}
	pickCon.setPivotB(newPivotB);
      }
    }
  }
  
  var dx, dy;
  dx = x - this.m_mouseOldX;
  dy = y - this.m_mouseOldY;

  function fmodf(u,v){
    var a = 1000000; // Make bigger for more precision
    return ((Math.round(u*a))%(Math.round(v*a)))/a;
  }

  if(this.mouseButton==1 && this.m_pickConstraint==null){
    this.m_azi += dx * 0.2;
    this.m_azi = fmodf(this.m_azi, 360.0);
    this.m_ele += dy * 0.2;
    this.m_ele = fmodf(this.m_ele, 180.0);
  } else if(this.mouseButton == 2){
    var hor = this.getRayTo(0,0).op_sub(this.getRayTo(1,0)).normalize();
    var vert = this.getRayTo(0,0).op_sub(this.getRayTo(0,1)).normalize();
    var multiplierX = 0.001;
    var multiplierY = 0.001;
    if(this.m_ortho){
      multiplierX = 1;
      multiplierY = 1;
    }
    //console.log(hor.x()+","+hor.y()+","+hor.z());
    this.m_cameraTargetPosition.op_add(hor.op_mul(dx * multiplierX));
    this.m_cameraTargetPosition.op_add(vert.op_mul(dy * multiplierY));
  } else if(this.mouseButton == 3){
    this.m_cameraDistance -= dy * 0.04;
    if (this.m_cameraDistance<0.1)
      this.m_cameraDistance = 0.1;
  }

  //}

  this.m_mouseOldX = x;
  this.m_mouseOldY = y;
  this.updateCamera();
};

// Needed?
DemoApplication.prototype.displayCallback = function(){};

DemoApplication.prototype.renderme = function(){
  // TODO
};

// Used???
DemoApplication.prototype.renderscene = function(pass){
  var m = new Float32Array(16);
  var rot = new Ammo.btMatrix3x3(); rot.setIdentity();
  var numObjects = this.m_dynamicsWorld.getNumCollisionObjects();
  var wireColor = new Ammo.btVector3(1,0,0);
  for(var i=0;i<numObjects;i++){
    var colObj = this.m_dynamicsWorld.getCollisionObjectArray()[i];
    var body = colObj;
    if(body&&body.getMotionState()){
      var myMotionState = body.getMotionState();
      myMotionState.m_graphicsWorldTrans.getOpenGLMatrix(m);
      rot=myMotionState.m_graphicsWorldTrans.getBasis();
    } else {
      colObj.getWorldTransform().getOpenGLMatrix(m);
      rot=colObj.getWorldTransform().getBasis();
    }
    var wireColor = new Ammo.btVector3(1.0,1.0,0.5); //wants deactivation
    if(i&1) wireColor=btVector3(0.0,0.0,1.0);
    ///color differently for active, sleeping, wantsdeactivation states
    if (colObj.getActivationState() == 1) //active
      {
	if (i & 1)
	  {
	    wireColor += new Ammo.btVector3(1.0,0.0,0.);
	    }
	  else
	    {			
	      wireColor += new Ammo.btVector3(0.5, 0.0, 0.0);
	    }
	}
     //ISLAND_SLEEPING
    if(colObj.getActivationState()==2){
      if(i&1)
	wireColor += btVector3 (0.0, 1.0, 0.0);
      else
	wireColor += btVector3 (0.0, 0.5,0.0);
    }
    
    var aabbMin = new Ammo.btVector3(0,0,0),
      aabbMax = new Ammo.btVector3(0,0,0);
    m_dynamicsWorld.getBroadphase().getBroadphaseAabb(aabbMin,aabbMax);
    
    aabbMin-=btVector3(BT_LARGE_FLOAT,BT_LARGE_FLOAT,BT_LARGE_FLOAT);
    aabbMax+=btVector3(BT_LARGE_FLOAT,BT_LARGE_FLOAT,BT_LARGE_FLOAT);
    
    if (!(getDebugMode()& this.DBG_DrawWireframe)){
      switch(pass){
      case	0:	m_shapeDrawer.drawOpenGL(m,colObj.getCollisionShape(),wireColor,getDebugMode(),aabbMin,aabbMax);break;
      case	1:	m_shapeDrawer.drawShadow(m,m_sundirection*rot,colObj.getCollisionShape(),aabbMin,aabbMax);break;
      case	2:	m_shapeDrawer.drawOpenGL(m,colObj.getCollisionShape(),wireColor*btScalar(0.3),0,aabbMin,aabbMax);break;
      }
    }
  }
};

DemoApplication.prototype.swapBuffers = function(){};
DemoApplication.prototype.updateModifierKeys = function(){};

DemoApplication.prototype.STEPSIZE = 5;

DemoApplication.prototype.stepLeft = function(){
  this.m_azi -= this.STEPSIZE;
  if(this.m_azi < 0)
    this.m_azi += 360;
  this.updateCamera(); 
};

DemoApplication.prototype.stepRight = function(){
  this.m_azi += this.STEPSIZE;
  if(this.m_azi >= 360)
    this.m_azi -= 360;
  this.updateCamera(); 
};

DemoApplication.prototype.stepFront = function(){
  this.m_ele += this.STEPSIZE;
  if(this.m_ele >= 360)
    this.m_ele -= 360;
  this.updateCamera();
};

DemoApplication.prototype.stepBack = function(){
  this.m_ele -= this.STEPSIZE;
  if(this.m_ele < 0)
    this.m_ele += 360;
  this.updateCamera();
};

DemoApplication.prototype.zoomIn = function(){ 
  this.m_cameraDistance -= 0.4;
  this.updateCamera(); 
  if(this.m_cameraDistance < 0.1)
    this.m_cameraDistance = 0.1;
};

DemoApplication.prototype.zoomOut = function(){
  this.m_cameraDistance += 0.4;
  this.updateCamera();
};

DemoApplication.prototype.isIdle = function(){
  return this.m_idle;
};

DemoApplication.prototype.setIdle = function(idle){
  this.m_idle = idle;
};
