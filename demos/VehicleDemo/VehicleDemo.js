function MyDemoApplication(options){
  // Apply "super" constructor
  DemoApplication.apply(this,arguments);
}

// Extend the DemoApplication object
$.extend(MyDemoApplication.prototype,
	 DemoApplication.prototype);

// This function sets up the physics scene.
var m_vehicle = null;
var gEngineForce = 0.0;
var gBreakingForce = 0.0;
var gVehicleSteering = 0.0;
MyDemoApplication.prototype.initPhysics = function(){

  // Setup collision detection
  var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  var overlappingPairCache = new Ammo.btDbvtBroadphase();

  // Setup solver and world
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  this.m_dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  this.m_dynamicsWorld.setGravity(this.tVec(0, -9.82, 0)); // DemoApplication.prototype.tVec(x,y,z) is a function that returns a temporary Ammo.btVector3, which is allocated by the DemoApplication. This way we don't need to use the "new" operator all the time and this improves performance. Don't use it for anything else than temporary things like this though.

  if(true){
    // Create ground plate in the center of the scene
    var groundShape = new Ammo.btBoxShape(this.tVec(20, 0.5, 40));
    var groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(this.tVec(0, -3.0, 0));
    var ground = this.localCreateRigidBody(0, groundTransform, groundShape);
  } else {

    // create a triangle-mesh ground
    var sizeofbtVector3 = 4*3;
    var sizeofint = 4;
    var vertStride = sizeofbtVector3;
    var indexStride = 3*sizeofint;
    var TRIANGLE_SIZE = 100;
    var NUM_VERTS_X = 20;
    var NUM_VERTS_Y = 20;
    var totalVerts = NUM_VERTS_X*NUM_VERTS_Y;
	
    var totalTriangles = 2*(NUM_VERTS_X-1)*(NUM_VERTS_Y-1);

    var m_vertices = [];
    var gIndices = [];

    for(var i=0; i<NUM_VERTS_X; i++){
      for(var j=0; j<NUM_VERTS_Y; j++){
	var wl = 0.2;
	//height set to zero, but can also use curved landscape, just uncomment out the code
	var height = 0.0;//20.f*sinf(float(i)*wl)*cosf(float(j)*wl);
	//m_vertices[i+j*NUM_VERTS_X].setValue(
	m_vertices.push(new Ammo.btVector3(
					   (i-NUM_VERTS_X*0.5)*TRIANGLE_SIZE,
					   height,
					   (j-NUM_VERTS_Y*0.5)*TRIANGLE_SIZE)
			);
      }
    }
    
    var index=0;
    for ( var i=0; i<NUM_VERTS_X-1; i++){
      for ( var j=0; j<NUM_VERTS_Y-1; j++){
	gIndices[index++] = j*NUM_VERTS_X+i;
	gIndices[index++] = j*NUM_VERTS_X+i+1;
	gIndices[index++] = (j+1)*NUM_VERTS_X+i+1;

	gIndices[index++] = j*NUM_VERTS_X+i;
	gIndices[index++] = (j+1)*NUM_VERTS_X+i+1;
	gIndices[index++] = (j+1)*NUM_VERTS_X+i;
      }
    }
	
    var m_indexVertexArrays = new btTriangleIndexVertexArray(totalTriangles,
							     gIndices,
							     indexStride,
							     totalVerts,
							     m_vertices[0].x(),
							     vertStride);

    var useQuantizedAabbCompression = true;
    var groundShape = new btBvhTriangleMeshShape(m_indexVertexArrays,
						 useQuantizedAabbCompression);

    var tr = new Ammo.btTransform();
    tr.setIdentity();
    tr.setOrigin(new Ammo.btVector3(-10,-10,-10));

    //m_collisionShapes.push(groundShape);

    //create ground object
    this.localCreateRigidBody(0,tr,groundShape);
  }

  // Jump
  var jumpShape = new Ammo.btBoxShape(this.tVec(1, 0.5, 2));
  var jumpTransform = new Ammo.btTransform();
  jumpTransform.setIdentity();
  jumpTransform.setOrigin(this.tVec(0, -2.2, 5));
  jumpTransform.setRotation(new Ammo.btQuaternion(this.tVec(1, 0, 0), -Math.PI/8));
  var jump = this.localCreateRigidBody(0, jumpTransform, jumpShape);

  // Create box wall
  var s = 1.3;
  var boxShape = new Ammo.btBoxShape(this.tVec(s*0.5, s*0.5, s*0.5));
  var boxTransform = new Ammo.btTransform();
  var Nsqrt = 4;
  for(var j=0; j<Nsqrt; j++){
    for(var i=0; i<Nsqrt; i++){
      boxTransform.setIdentity();
      boxTransform.setOrigin(this.tVec(s*j-(Nsqrt-1)*s*0.5, s*i, 10));
      this.localCreateRigidBody(1, boxTransform, boxShape);
    }
  }

  // Create infinite ground plane 50 meters down. This is to make sure things don't fall down to infinity and irritate our collision detection
  var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), -50);
  var aabbTransform = new Ammo.btTransform();
  aabbTransform.setIdentity();
  this.localCreateRigidBody(0, aabbTransform, aabbShape);

  // --- Bullet demo code ---
  var rightIndex = 0; 
  var upIndex = 1; 
  var forwardIndex = 2;
  var wheelDirectionCS0 = new Ammo.btVector3(0,-1,0);
  var wheelAxleCS = new Ammo.btVector3(-1,0,0);

  var CUBE_HALF_EXTENTS = 1;
  ///btRaycastVehicle is the interface for the constraint that implements the raycast vehicle
  ///notice that for higher-quality slow-moving vehicles, another approach might be better
  ///implementing explicit hinged-wheel constraints with cylinder collision, rather then raycasts
  gEngineForce = 0.0;
  gBreakingForce = 0.0;

  var maxEngineForce = 1000.0;//this should be engine/velocity dependent
  var maxBreakingForce = 100.0;

  gVehicleSteering = 0.0;
  var steeringIncrement = 0.04;
  var steeringClamp = 0.3;
  var wheelRadius = 0.5;
  var wheelWidth = 0.3;
  var wheelFriction = 1000;//BT_LARGE_VAR;
  var suspensionStiffness = 20.0;
  var suspensionDamping = 2.3;
  var suspensionCompression = 4.4;
  var suspensionRestLength = 0.6;
  var rollInfluence = 0.1;//1.0f;

  var m_collisionShapes = [];

  var localTrans = new Ammo.btTransform();
  localTrans.setIdentity();

  var chassisShape = new Ammo.btBoxShape(new Ammo.btVector3(1,0.5,2));
  m_collisionShapes.push(chassisShape);
  
  var compound = new Ammo.btCompoundShape();
  m_collisionShapes.push(compound);
  var localTrans = new Ammo.btTransform();
  localTrans.setIdentity();

  var tr = new Ammo.btTransform();
  tr.setIdentity();

  // localTrans effectively shifts the center of mass with respect to the chassis
  localTrans.setOrigin(new Ammo.btVector3(0,1,0));
  compound.addChildShape(localTrans,chassisShape);
  tr.setOrigin(new Ammo.btVector3(0,0,-10));
  
  var m_carChassis = this.localCreateRigidBody(50,tr,compound);//chassisShape);
  //m_carChassis.setDamping(0.2,0.2);
  
  var m_wheelShape = new Ammo.btCylinderShapeX(new Ammo.btVector3(wheelWidth,wheelRadius,wheelRadius));
  
  // --- create vehicle ---
  var m_tuning = new Ammo.btVehicleTuning();
  var m_vehicleRayCaster = new Ammo.btDefaultVehicleRaycaster(this.getDynamicsWorld());
  m_vehicle = new Ammo.btRaycastVehicle(m_tuning, m_carChassis, m_vehicleRayCaster);

  ///never deactivate the vehicle
  m_carChassis.setActivationState(this.DISABLE_DEACTIVATION);
  var connectionHeight = 1.2;
  var isFrontWheel = true;

  // choose coordinate system
  m_vehicle.setCoordinateSystem(rightIndex,upIndex,forwardIndex);

  var connectionPointCS0 = new Ammo.btVector3(CUBE_HALF_EXTENTS-(0.3*wheelWidth),
					      connectionHeight,
					      2*CUBE_HALF_EXTENTS-wheelRadius);

  m_vehicle.addWheel(connectionPointCS0,
		     wheelDirectionCS0,
		     wheelAxleCS,
		     suspensionRestLength,
		     wheelRadius,
		     m_tuning,
		     isFrontWheel);

  connectionPointCS0 = new Ammo.btVector3(-CUBE_HALF_EXTENTS+(0.3*wheelWidth),
					      connectionHeight,
					      2*CUBE_HALF_EXTENTS-wheelRadius);

  m_vehicle.addWheel(connectionPointCS0,
		     wheelDirectionCS0,
		     wheelAxleCS,
		     suspensionRestLength,
		     wheelRadius,
		     m_tuning,
		     isFrontWheel);
  connectionPointCS0 = new Ammo.btVector3(-CUBE_HALF_EXTENTS+(0.3*wheelWidth),
					  connectionHeight,
					  -2*CUBE_HALF_EXTENTS+wheelRadius);
  isFrontWheel = false;
  m_vehicle.addWheel(connectionPointCS0,
		     wheelDirectionCS0,
		     wheelAxleCS,
		     suspensionRestLength,
		     wheelRadius,
		     m_tuning,
		     isFrontWheel);

  connectionPointCS0 = new Ammo.btVector3(CUBE_HALF_EXTENTS-(0.3*wheelWidth),
					  connectionHeight,
					  -2*CUBE_HALF_EXTENTS+wheelRadius);

  m_vehicle.addWheel(connectionPointCS0,
		     wheelDirectionCS0,
		     wheelAxleCS,
		     suspensionRestLength,
		     wheelRadius,
		     m_tuning,
		     isFrontWheel);
		
  for (var i=0; i<m_vehicle.getNumWheels(); i++){
    var wheel = m_vehicle.getWheelInfo(i);
    wheel.set_m_suspensionStiffness(suspensionStiffness);
    wheel.set_m_wheelsDampingRelaxation(suspensionDamping);
    wheel.set_m_wheelsDampingCompression(suspensionCompression);
    wheel.set_m_frictionSlip(wheelFriction);
    wheel.set_m_rollInfluence(rollInfluence);
  }

  this.addVehicle(m_vehicle,m_wheelShape);
  
  // Example of setting a callback - overrides old callbacks
  this.keyboardCallback({
      left:function(event,demoapplication){
	gVehicleSteering = 0.2;
      },
      right:function(event,demoapplication){
	gVehicleSteering = -0.2;
      },
      up:function(event,demoapplication){
	gEngineForce = maxEngineForce;
	gBreakingForce = 0.0;
      },
      down:function(event,demoapplication){
	gEngineForce = -maxEngineForce;
	//gBreakingForce = maxBreakingForce; 
	//gEngineForce = 0.0;
      }
    });

  this.keyboardUpCallback({
      left:function(){ gVehicleSteering = 0.0; },
      right:function(){ gVehicleSteering = 0.0; },
      up:function(){
	gEngineForce = 0.0;
	gBreakingForce = 0.0;
      },
      down:function(){
	gBreakingForce = 0.0; 
	gEngineForce = 0.0;
      }
    });

  // Reset scene
  this.clientResetScene();
  this.m_shapeDrawer.fog(false);
  this.setAzi(70);
  this.setEle(20);
  this.setCameraDistance(80);
};

// Executed every time step
MyDemoApplication.prototype.clientMoveAndDisplay = function(){

  m_vehicle.applyEngineForce(gEngineForce,2);
  m_vehicle.setBrake(gBreakingForce,2);
  m_vehicle.applyEngineForce(gEngineForce,3);
  m_vehicle.setBrake(gBreakingForce,3);
  m_vehicle.setSteeringValue(gVehicleSteering,0);
  m_vehicle.setSteeringValue(gVehicleSteering,1);

  for(i=0;i<m_vehicle.getNumWheels();i++){
    // synchronize the wheels with the (interpolated) chassis worldtransform
    m_vehicle.updateWheelTransform(i,true);
    // draw wheels (cylinders)
    //m_vehicle.getWheelInfo(i).m_worldTransform.getOpenGLMatrix(m);
    //m_shapeDrawer.drawOpenGL(m,m_wheelShape,wheelColor,getDebugMode(),worldBoundsMin,worldBoundsMax);
  }
  
  var ms = this.getDeltaTimeMicroseconds();
  var minFPS = 1000000.0/60.0;
  if(ms > minFPS)
    ms = minFPS;
  
  if(this.m_dynamicsWorld)
    this.m_dynamicsWorld.stepSimulation(ms / 1000000.0);
};
