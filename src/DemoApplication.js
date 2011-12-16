/**
 * @file DemoApplication.js
 * @brief Main demo application.
 */

/**
 * @class DemoApplication
 * @brief The main demo class. Extend it to make your own.
 */

/**
 * Constructor of the demoapp object
 * @tparam array options
 * @ctor
 */
function DemoApplication(options){
  
  if(!(Ammo && ShapeDrawer && Float32Array))
    throw "Needs Ammo and ShapeDrawer!";

  var settings = {
    shapeDrawer:new ShapeDrawer()
  };
  /**
   * App settings
   * @private
   */
  this.settings = settings;
  $.extend(settings,options);
  
  var th = this;

  // DemoApplication things
  /**
   * Use or not use 6 degrees of freedom?
   * @todo Used?
   */
  this.use6Dof = false;
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

  /**
   * Reusable transform - to save memory leak and increase performance
   */
  this.tempTransform = new Ammo.btTransform();

  /**
   * Reusable quaternion - to save memory leak and increase performance
   */
  this.tempQuaternion = new Ammo.btQuaternion(0, 0, 0, 0);

  /**
   * Reusable vector - to save memory leak and increase performance
   */
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
  /**
   * Local box body counter
   * @private
   */ 
  this.shootboxcounter = 0;
  /**
   * Local storage of box bodies
   * @private
   */
  this.shootboxbodies = [];

  var m_dt = th.m_dt = 1/60;
  var m_stepping = th.m_stepping = true;
  var m_singleStep = th.m_singleStep = false;
  var m_idle = th.m_idle = false;
  var m_lastKey = th.m_lastKey = 0;

  /**
   * Storage array for bodies
   * @private
   */
  this.m_bodies = [];
  /**
   * Storage array for motion states
   * @private
   */
  this.m_startMotionStates = [];

  var m_shapeDrawer = th.m_shapeDrawer = settings.shapeDrawer;
  var m_enableshadows = th.m_enableshadows = true;
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
  
  function mapKeyCodeToString(keycode){
    switch(keycode){
    case th.keys.LEFT:  return 'left';  break;
    case th.keys.RIGHT: return 'right'; break;
    case th.keys.DOWN:  return 'down';  break;
    case th.keys.UP:    return 'up';    break;
    default:
      return String.fromCharCode(keycode).toLowerCase();
    }
  }

  // Keydown callbacks
  window.addEventListener('keydown', function(e){
      var f;
      f = th.keyboardCallbacksInternal[mapKeyCodeToString(e.keyCode)];
      if(f)
	f(e,th);
    });

  // Keyup callbacks
  window.addEventListener('keyup', function(e){
      var f;
      f = th.keyboardUpCallbacksInternal[mapKeyCodeToString(e.keyCode)];
      if(f)
	f(e,th);
      /*
      var char = String.fromCharCode(e.keyCode).toLowerCase();
      var f = th.keyboardUpCallbacksInternal[char];
      if(f) f(e,th);
      */
    });

  /**
   * Canvas screen width
   * @private
   */
  this.m_glScreenWidth = m_shapeDrawer.getScreenWidth();

  /**
   * Canvas screen height
   * @private
   */
  this.m_glScreenHeight = m_shapeDrawer.getScreenHeight();

  // Init stats
  var nstats = 20;
  /**
   * Physics step statistics storage
   * @private
   */
  this.stepstats = new Float32Array(nstats);
  var drawstats = new Float32Array(nstats);
  /**
   * Number of stats to sample before averaging
   * @private
   */
  this.nstats = nstats;

  /** 
   * Storage array for drawing time (milliseconds)
   * @private
   */
  this.drawstats = drawstats;
  var totalstats = new Float32Array(nstats);

  /** 
   * Storage array for drawing time (milliseconds)
   * @private
   */
  this.totalstats = totalstats;
  var t = 0;
  /**
   * Local timestep number (goes from 0 and ticking in integer steps)
   */
  this.t = t;

  // Init shapedrawer
  th.m_shapeDrawer.m_dynamicsWorld = m_dynamicsWorld;
  th.lastTotalTiming = new Date().getTime();
  m_shapeDrawer.idleFunc = function(){
    th.moveAndDisplay();
    th.updateHud();
    th.updateShapeDrawer();
    var t1 = new Date().getTime();
    th.totalstats[th.t%th.nstats] = 1000./(t1 - th.lastTotalTiming);
    th.lastTotalTiming = t1;
  }
  m_shapeDrawer.update();
  this.updateCamera();

  // Start
  this.setShootBoxShape();
  this.updateCamera();
  this.initPhysics(this);
  this.updateCamera();
}

/**
 * Makes the shapedrawer read the Ammo physics state and updates rendered objects.
 */
DemoApplication.prototype.updateShapeDrawer = function(){
  var t0 = new Date().getTime();
  this.m_shapeDrawer.update();
  var t1 = new Date().getTime();
  this.drawstats[this.t%this.nstats] = t1-t0;
}

/**
 * Get the btDynamicsWorld object from the demo app
 * @treturn btDynamicsWorld
 * @deprecated Use DemoApplication.dynamicsWorld() instead
 */
DemoApplication.prototype.getDynamicsWorld = function(){
  return this.m_dynamicsWorld;
};

/**
 * Get/set the btDynamicsWorld object in the demo app
 * @tparam btDynamicsWorld world
 * @treturn btDynamicsWorld
 */
DemoApplication.prototype.dynamicsWorld = function(world){
  if(world===undefined)
    return this.m_dynamicsWorld;
  else if(typeof(world)=="object")
    this.m_dynamicsWorld = world;
  else
    throw "Argument must be Ammo.btDynamicsWorld object, "+typeof(world)+" given.";
};

/**
 * Updates the heads up display with fresh statistics
 * @private
 */
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

/**
 * Calculate the average of the numbers in a vector
 * @tparam array v The input array of numbers.
 * @treturn float The average
 */
function avg(v){
  s = 0.0;
  for(var i=0; i<v.length; i++)
    s += v[i];
  return s/v.length;
}

/**
 * To be overridden by your demo app
 * @brief To be overridden by your demo app
 */
DemoApplication.prototype.initPhysics = function(){
  // OVERRIDE ME
};

/**
 * Draw or not draw clusters?
 * @tparam bool drawClusters
 * @todo Implement me!
 */
DemoApplication.prototype.setDrawClusters = function(drawClusters){
  // Todo
};

/**
 * A large float
 * @brief Use for "large" numbers
 * @treturn float
 */
DemoApplication.prototype.BT_LARGE_FLOAT = 1000000.0;

/**
 * Override the current ShapeDrawer
 * @tparam ShapeDrawer shapeDrawer
 */
DemoApplication.prototype.overrideWebGLShapeDrawer = function(shapeDrawer){
  var bodies;
  if(this.shapeDrawer)
    bodies = this.shapeDrawer.bodies;
  this.shapeDrawer = shapeDrawer;
  this.shapeDrawer.update();
};

/**
 * Set orthographic projection
 * @todo Implement me!
 */
DemoApplication.prototype.setOrthographicProjection = function(){
  // TODO
};

/**
 * Resets the perspective projection matrix
 * @todo implement me
 */
DemoApplication.prototype.resetPerspectiveProjection = function(){
  // TODO
};

/**
 * Toggle texturing
 * @tparam bool enable
 */
DemoApplication.prototype.setTexturing = function(enable){
  return this.m_shapeDrawer.enableTexture(enable);
};

/**
 * Toggle shadows
 * @tparam bool enable
 */
DemoApplication.prototype.setShadows = function(enable){
  var p = m_enableshadows;
  this.m_enableshadows = enable;
  this.m_shapeDrawer.enableShadows(enable);
  return (p);
};

/**
 * Is texturing enabled?
 * @treturn bool
 */
DemoApplication.prototype.getTexturing = function(){
  return this.m_shapeDrawer.hasTextureEnabled();
};

/**
 * Are shadows enabled?
 * @treturn bool
 */
DemoApplication.prototype.getShadows = function(){
  return this.m_enableshadows;
};

/**
 * Get the current debug mode
 * @treturn int
 */
DemoApplication.prototype.getDebugMode = function(){
  return this.m_debugMode;
};

/**
 * Set debug mode.
 * @tparam int mode
 */
DemoApplication.prototype.setDebugMode = function(mode){
  this.m_debugMode = mode;
};

/**
 * Set azimuth camera position in degrees
 * @tparam float azi
 */
DemoApplication.prototype.setAzi = function(azi){
  this.m_azi = azi;
};

/**
 * Set elevation camera position in degrees
 * @tparam float ele
 */	
DemoApplication.prototype.setEle = function(ele){
  this.m_ele = ele;
};

/**
 * Set camera up direction
 * @tparam btVector3 camUp
 */
DemoApplication.prototype.setCameraUp = function(camUp){
  this.m_cameraUp = camUp;
};

/**
 * Set camera forward axis
 * @tparam btVector3 axis
 */
DemoApplication.prototype.setCameraForwardAxis = function(axis){
  this.m_forwardAxis = axis;
};

/**
 * Toggle idle mode. Will pause/unpause physics.
 */
DemoApplication.prototype.toggleIdle = function(){
  this.m_idle = !this.m_idle;
};

/**
 * A small number...
 * @treturn float
 */
DemoApplication.prototype.SIMD_EPSILON = 0.01;	

/**
 * Update the camera position. Should be done after changing camera orientation parameters.
 */
DemoApplication.prototype.updateCamera = function(){

  var rele = this.m_ele * (0.01745329251994329547);// rads per deg
  var razi = this.m_azi * (0.01745329251994329547);// rads per deg

  var rot = new Ammo.btQuaternion();
  rot.setRotation(this.m_cameraUp,
		  razi);

  var eyePos = new Ammo.btVector3(0,0,0);
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
  default:
    eyePos.setZ(-this.m_cameraDistance);
    break;
  }
  var forward = new Ammo.btVector3(eyePos.x(),eyePos.y(),eyePos.z());
  forward.normalize();
    if(forward.length2() < this.SIMD_EPSILON)
    forward.setValue(1.0,0.0,0.0);

  var right = this.m_cameraUp.cross(forward);
  var roll = new Ammo.btQuaternion();
  roll.setRotation(right, -rele);

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
			    
  var rollmat = new Ammo.btMatrix3x3();
  rollmat.setRotation(roll);
  var rotmat = new Ammo.btMatrix3x3();
  rotmat.setRotation(rot);

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

/**
 * Get the current camera position.
 * @treturn btVector3
 */
DemoApplication.prototype.getCameraPosition = function(){
  return this.m_cameraPosition;
};

/**
 * Get the current camera target position.
 * @treturn btVector3
 */
DemoApplication.prototype.getCameraTargetPosition = function(){
  return this.m_cameraTargetPosition;
};

/**
 * Get the time since last physics step in microseconds.
 * @treturn int
 */
DemoApplication.prototype.getDeltaTimeMicroseconds = function(){
  var t = new Date();
  var dt = 0.0;
  if(this.m_clock)
    dt = (t.getTime() - this.m_clock.getTime())*1000;
  this.m_clock = t;
  return dt;
};

/**
 * Set the view frustum
 * @tparam float zNear
 * @tparam float zFar
 * @todo complete
 */
DemoApplication.prototype.setFrustumZPlanes = function(zNear, zFar){
  this.m_frustumZNear = zNear;
  this.m_frustumZFar = zFar;
};

/**
 * Get the camera distance
 * @treturn float
 */
DemoApplication.prototype.getCameraDistance = function(){
  return this.m_cameraDistance;
};

/**
 * Set the camera distance
 * @tparam float dist
 */
DemoApplication.prototype.setCameraDistance = function(dist){
  this.m_cameraDistance = dist;
};

/**
 * Used internally by DemoApplication
 * @todo make private?
 */
DemoApplication.prototype.moveAndDisplay = function(){
  var t0 = new Date().getTime();
  if (!this.m_idle){
    this.clientMoveAndDisplay(this);
  } else
    this.displayCallback();
  var t1 = new Date().getTime();
  this.stepstats[this.t%this.nstats] = t1-t0;
  this.t++;
};

/**
 * To be overridden
 */
DemoApplication.prototype.clientMoveAndDisplay = function(){
  // Override me!
};

/**
 * Resets the scene
 * @brief Resets the scene
 */
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

/**
 * Set the shooting shape type
 * @tparam string shapeType Either 'box', 'sphere', 'cylinder' or 'cone'
 */
DemoApplication.prototype.setShootBoxShape = function(shapeType){
  switch(shapeType){
  case 'box':      this.m_shootBoxShape = new Ammo.btBoxShape(this.tVec(.5,.5,.5)); break;
  case 'sphere':   this.m_shootBoxShape = new Ammo.btSphereShape(.5); break;
  case 'cylinder': this.m_shootBoxShape = new Ammo.btCylinderShape(this.tVec(.5,.5,.5)); break;
  case 'cone':     this.m_shootBoxShape = new Ammo.btConeShape(.5,1); break;
  default: this.setShootBoxShape('sphere'); break;
  }
};

/**
 * Sets the local temp vector in the DemoApplication objects to specified coordinates and returns it. Therefore, this function should only be used once at a time (collisions may occur).
 * @tparam float x
 * @tparam float y
 * @tparam float z
 * @treturn btVector3
 */
DemoApplication.prototype.tVec = function(x,y,z){
  this.tempVector3.setValue(x,y,z);
  return this.tempVector3;
};

/**
 * To save some memory leaking. 
 * @see tVec()
 * @tparam float x
 * @tparam float y
 * @tparam float z
 * @tparam float w
 * @treturn btVector3
 */
DemoApplication.prototype.tQuat = function(x,y,z,w){
  this.tempQuaternion.setValue(x,y,z,w);
  return this.tempQuaternion;
};
    
/**
 * Shoot a box
 * @todo make private to DemoApplication?
 * @tparam btVector3 destination
 */
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

/**
 * Debug print a vector
 * @tparam btVector3 v
 * @tparam string name
 */
function printv(v,name){
  console.log((name?name+": ":"")+v.x()+","+v.y()+","+v.z());
}

/**
 * Get vector ray into 3D space when clicking the 2D coordinate (x,y)
 * @tparam int x
 * @tparam int y
 * @treturn btVector3
 */
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

/**
 * JavaScript key codes packed neatly into an array
 * Contains codes: BACKSPACE, TAB, ENTER, SHIFT, CTRL, ALT, PAUSE, CAPS, ESCAPE, PAGEUP, PAGEDOWN, END, HOME, LEFT, UP, RIGHT, DOWN, INSERT, DELETE
 * @treturn object
 */
DemoApplication.prototype.keys = {BACKSPACE: 8,
				  TAB: 9,
				  ENTER: 13,
				  SHIFT: 16,
				  CTRL: 17,
				  ALT: 18,
				  PAUSE: 19,
				  CAPS: 20,
				  ESCAPE: 27,
				  PAGEUP: 33,
				  PAGEDOWN: 34,
				  END: 35,
				  HOME: 36,
				  LEFT: 37,
				  UP: 38,
				  RIGHT: 39,
				  DOWN: 40,
				  INSERT: 45,
				  DELETE: 46};

/**
 * Mouse picking clamping
 * @treturn float
 */
DemoApplication.prototype.mousePickClamping = 30.0;

/** btBoxShape */
DemoApplication.prototype.BOX_SHAPE_PROXYTYPE = 0;
/** btTriangleShape */
DemoApplication.prototype.TRIANGLE_SHAPE_PROXYTYPE = 1;
/** what? */
DemoApplication.prototype.TETRAHEDRAL_SHAPE_PROXYTYPE = 2;
/** btConvexTriangleMeshShape */
DemoApplication.prototype.CONVEX_TRIANGLEMESH_SHAPE_PROXYTYPE = 3;
/** btConvexHullShape */
DemoApplication.prototype.CONVEX_HULL_SHAPE_PROXYTYPE = 4;
/** btConvexPointCloudShape */
DemoApplication.prototype.CONVEX_POINT_CLOUD_SHAPE_PROXYTYPE = 5;
/** what? */
DemoApplication.prototype.CUSTOM_POLYHEDRAL_SHAPE_TYPE = 6;
/** what? */
DemoApplication.prototype.IMPLICIT_CONVEX_SHAPES_START_HERE = 7;
/** btSphereShape */
DemoApplication.prototype.SPHERE_SHAPE_PROXYTYPE = 8;
/** btMultiSphereShape */
DemoApplication.prototype.MULTI_SPHERE_SHAPE_PROXYTYPE = 9;
/** btCapsuleShape */
DemoApplication.prototype.CAPSULE_SHAPE_PROXYTYPE = 10;
/** btConeShape */
DemoApplication.prototype.CONE_SHAPE_PROXYTYPE = 11;
/** btConvexShape */
DemoApplication.prototype.CONVEX_SHAPE_PROXYTYPE = 12;
/** btCylinderShape */
DemoApplication.prototype.CYLINDER_SHAPE_PROXYTYPE = 13;
/** btUniformScalingShape */
DemoApplication.prototype.UNIFORM_SCALING_SHAPE_PROXYTYPE = 14;
/** btMinkowskiSumShape */
DemoApplication.prototype.MINKOWSKI_SUM_SHAPE_PROXYTYPE = 15;
/** what? */
DemoApplication.prototype.MINKOWSKI_DIFFERENCE_SHAPE_PROXYTYPE = 16;
/** btBox2dShape */
DemoApplication.prototype.BOX_2D_SHAPE_PROXYTYPE = 17;
/** btConvex2dShape */
DemoApplication.prototype.CONVEX_2D_SHAPE_PROXYTYPE = 18;
/** what? */
DemoApplication.prototype.CUSTOM_CONVEX_SHAPE_TYPE = 19;
/** what? */
DemoApplication.prototype.CONCAVE_SHAPES_START_HERE = 20;
/** btTriangleMeshShape */
DemoApplication.prototype.TRIANGLE_MESH_SHAPE_PROXYTYPE = 21;
/** btScaledBvhTriangleMeshShape */
DemoApplication.prototype.SCALED_TRIANGLE_MESH_SHAPE_PROXYTYPE = 22;
/** what? */
DemoApplication.prototype.FAST_CONCAVE_MESH_PROXYTYPE = 23;
/** btHeightfieldTerrainShape? */
DemoApplication.prototype.TERRAIN_SHAPE_PROXYTYPE = 24;
/** what? */
DemoApplication.prototype.GIMPACT_SHAPE_PROXYTYPE = 25;
/** what? */
DemoApplication.prototype.MULTIMATERIAL_TRIANGLE_MESH_PROXYTYPE = 26;
/** btEmptyShape */
DemoApplication.prototype.EMPTY_SHAPE_PROXYTYPE = 27;
/** what? */
DemoApplication.prototype.STATIC_PLANE_PROXYTYPE = 28;
/** what? */
DemoApplication.prototype.CUSTOM_CONCAVE_SHAPE_TYPE = 29;
/** what? */
DemoApplication.prototype.CONCAVE_SHAPES_END_HERE = 30;
/** btCompoundShape */
DemoApplication.prototype.COMPOUND_SHAPE_PROXYTYPE = 31;
/** btSoftBodyCollisionShape */
DemoApplication.prototype.SOFTBODY_SHAPE_PROXYTYPE = 32;
/** what? */
DemoApplication.prototype.HFFLUID_SHAPE_PROXYTYPE = 33;
/** what? */
DemoApplication.prototype.HFFLUID_BUOYANT_CONVEX_SHAPE_PROXYTYPE = 34;
/** what? */
DemoApplication.prototype.INVALID_SHAPE_PROXYTYPE = 35;
/** what? */
DemoApplication.prototype.MAX_BROADPHASE_COLLISION_TYPES = 36;

/**
 * Maximum shoot shapes that will be spawned. If the number of shapes exceeds this number, the oldest shape will be deleted.
 * @treturn int
 */
DemoApplication.prototype.MAX_SHOOTBOXES = 10;

/**
 * Motionstate flag
 * @treturn int
 */
DemoApplication.prototype.DISABLE_DEACTIVATION = 4;

/**
 * Spawns a rigid body into the demo scene
 * @tparam float mass
 * @tparam btTransform startTransform
 * @tparam btCollisionShape shape
 * @tparam Object options
 * @treturn btRigidBody
 */
DemoApplication.prototype.localCreateRigidBody = function(mass, startTransform, shape, options){
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
  body.setLinearVelocity(new Ammo.btVector3(0,0,0));
  body.setAngularVelocity(new Ammo.btVector3(0,0,0));
  body.setContactProcessingThreshold(this.m_defaultContactProcessingThreshold);
  this.m_dynamicsWorld.addRigidBody(body);
  this.m_shapeDrawer.add(body,shape,options);
  this.m_bodies.push(body);
  this.m_startMotionStates.push(myMotionState);
  return body;
};

/**
 * Add a vehicle to the simulation.
 * @tparam btRaycastVehicle v
 * @tparam btCollisionShape wheelshape
 * @tparam Object options Options to provide to ShapeDrawer.addVehicle
 */
DemoApplication.prototype.addVehicle = function(v,wheelshape,options){
  this.m_dynamicsWorld.addVehicle(v);
  this.m_shapeDrawer.addVehicle(v,wheelshape,options);
};

/**
 * Debug render mode flag
 * @treturn int
 */
DemoApplication.prototype.DBG_NoHelpText = 1;

/**
 * Keyup callbacks
 * @private
 * @treturn Object
 */
DemoApplication.prototype.keyboardUpCallbacksInternal = {
  // Nothing here from the beginning
};

/**
 * Extends the keyboard callbacks. k is an object on the JSON format with buttons as keys and callbacks as values. Example that sets the plus button callback follows.
 *
 * @tparam Object k
 *
 * @code
 * keyboardCallback({'+':function(event,demoapplication){...}})
 * @endcode
 */
DemoApplication.prototype.keyboardCallback = function(k){
  $.extend(this.keyboardCallbacksInternal,k);
};

/**
 * Extends the keyboard callbacks. k is an object on the JSON format with buttons as keys and callbacks as values. Example that sets the plus button callback follows.
 * @tparam object k
 * @code
 * keyboardCallback({'+':function(event,demoapplication){...}})
 * @endcode
 */
DemoApplication.prototype.keyboardUpCallback = function(k){
  $.extend(this.keyboardUpCallbacksInternal,k);
};

/**
 * On reshaping the screen to (w,h)
 * @tparam int w
 * @tparam int h
 * @todo Implement me!
 */
DemoApplication.prototype.reshape = function(w, h){
  this.m_webglScreenWidth = w;
  this.m_webglScreenHeight = h;
  // TODO: THE REST
  this.updateCamera();
};

/**
 * Triggers when clicking.
 * @tparam Object event The javascript event object
 */
DemoApplication.prototype.mouseFunc = function(event){
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

/**
 * Mouse motion function. Triggers when moving mouse.
 * @tparam Object event
 */
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

/**
 * Called on render.
 * @todo Needed?
 */
DemoApplication.prototype.displayCallback = function(){};

/**
 * Step in degrees, used when rotating in eg azimuthal direction
 * @treturn int
 */
DemoApplication.prototype.STEPSIZE = 5;

/**
 * Step (rotate) camera left
 */
DemoApplication.prototype.stepLeft = function(){
  this.m_azi -= this.STEPSIZE;
  if(this.m_azi < 0)
    this.m_azi += 360;
  this.updateCamera(); 
};

/**
 * Steps camera left, azimuth += step
 */
DemoApplication.prototype.stepRight = function(){
  this.m_azi += this.STEPSIZE;
  if(this.m_azi >= 360)
    this.m_azi -= 360;
  this.updateCamera(); 
};

/**
 * Steps camera forward, elevation += step
 */
DemoApplication.prototype.stepFront = function(){
  this.m_ele += this.STEPSIZE;
  if(this.m_ele >= 360)
    this.m_ele -= 360;
  this.updateCamera();
};

/**
 * "Steps backs" in camera position, eg elevation -= step
 */
DemoApplication.prototype.stepBack = function(){
  this.m_ele -= this.STEPSIZE;
  if(this.m_ele < 0)
    this.m_ele += 360;
  this.updateCamera();
};

/**
 * Zooms in, eg camera distance -= step
 */
DemoApplication.prototype.zoomIn = function(){ 
  this.m_cameraDistance -= 0.4;
  if(this.m_cameraDistance < 0.1)
    this.m_cameraDistance = 0.1;
  this.updateCamera();
};

/**
 * Zooms in, eg camera distance += step
 */
DemoApplication.prototype.zoomOut = function(){
  this.m_cameraDistance += 0.4;
  this.updateCamera();
};

/**
 * Return camera idle state
 * @treturn bool
 */
DemoApplication.prototype.isIdle = function(){
  return this.m_idle;
};

/**
 * Set the idle state
 * @tparam bool idle
 */
DemoApplication.prototype.setIdle = function(idle){
  this.m_idle = idle;
};

/**
 * Internal keyboard callbacks are saved in this object.
 * @see keyboardCallback()
 * @private
 */
DemoApplication.prototype.keyboardCallbacksInternal = {
  q:function(e,da){ },
  l:function(e,da){ da.stepLeft(); },
  r:function(e,da){ da.stepRight(); },
  f:function(e,da){ da.stepFront(); },
  b:function(e,da){ da.stepBack(); },
  z:function(e,da){ da.zoomIn(); },
  x:function(e,da){ da.zoomOut(); },
  i:function(e,da){ da.toggleIdle(); },
  g:function(e,da){ da.m_enableshadows=!da.m_enableshadows; da.m_shapeDrawer.enableShadows(da.m_enableshadows); },
  u:function(e,da){ da.m_shapeDrawer.enableTexture(!da.m_shapeDrawer.enableTexture(false)); },
  h:function(e,da){
    if(da.m_debugMode & da.DBG_NoHelpText)
      da.m_debugMode = da.m_debugMode & (~da.DBG_NoHelpText);
    else
      da.m_debugMode |= da.DBG_NoHelpText;
  },
  ' ':function(e,da){
    da.clientResetScene();
  }
};