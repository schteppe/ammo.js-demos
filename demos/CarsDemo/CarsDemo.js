function MyDemoApplication(options){
  // Apply "super" constructor
  DemoApplication.apply(this,arguments);
}

// Extend the DemoApplication object
$.extend(MyDemoApplication.prototype,
	 DemoApplication.prototype);

// This function sets up the physics scene.
var m_vehicle = null;
var maxEngineForce = 0.0;
var gEngineForce = 0.0;
var gBreakingForce = 0.0;
var gVehicleSteering = 0.0;
MyDemoApplication.prototype.initPhysics = function(){
  var th = this;
  
  // Setup collision detection
  var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  var overlappingPairCache = new Ammo.btDbvtBroadphase();

  // Setup solver and world
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  this.m_dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  this.m_dynamicsWorld.setGravity(this.tVec(0, -9.82, 0));

  // TEXT
  var strings = ["THREE","AMMO"];
  var colors = [0xff0000, 0xffffff];
  var textx = [-5,-5];
  var textz = [1,3];
  var boxTransform = new Ammo.btTransform();
  for(var k=0; k<strings.length; k++){
    for(var i=0; i<strings[k].length; i++){
      var textGeo = new THREE.TextGeometry( strings[k][i], {
	  size: 1,
	  height: 1,
	  curveSegments: 30,
	  font: "helvetiker",
	  weight: "bold",
	  style: "normal",
	  bevelThickness: 0.1,
	  bevelSize: 0.1,
	  bevelEnabled: true
	});
      textGeo.computeBoundingBox();
      var bb = textGeo.boundingBox;
      var textmesh = new THREE.Mesh(textGeo,
				    new THREE.MeshPhongMaterial({ color: colors[k], specular: 0xffffff, ambient: 0x555555 }));
      textmesh.position.set(-0.5*(bb.x[1]+bb.x[0]),
			    -0.5*(bb.y[1]+bb.y[0]),
			    -0.5*(bb.z[1]+bb.z[0]));
      var o = new THREE.Object3D();
      boxTransform.setIdentity();
      boxTransform.setOrigin(this.tVec(textx[k],
				       (strings[k].length -(i+0.5))*(bb.y[1]-bb.y[0]),
				       textz[k]));
      boxTransform.setRotation(new btQuaternion(this.tVec(0,1,0),-Math.PI/2));
      var boxShape = new Ammo.btBoxShape(this.tVec(0.5*(bb.x[1]-bb.x[0]),
						   0.5*(bb.y[1]-bb.y[0]),
						   0.5*(bb.z[1]-bb.z[0])));
      textmesh.castShadow = true;
      textmesh.receiveShadow = true;
      o.add(textmesh);
      this.localCreateRigidBody(1,boxTransform,boxShape,{threemesh:o});
    }
  }

  // Create infinite ground plane 50 meters down. This is to make sure things don't fall down to infinity and irritate our collision detection
  var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), 0);
  var aabbTransform = new Ammo.btTransform();
  aabbTransform.setIdentity();
  this.localCreateRigidBody(0, aabbTransform, aabbShape);

  // Vehicle
  var wheelLoader = new THREE.BinaryLoader(true);
  wheelLoader.load({
      model: "../../other/three/obj/veyron/parts/veyron_wheel_bin.js",
      callback: function(wheelGeometry){
	var bodyLoader = new THREE.BinaryLoader(true);
	bodyLoader.load({
	    model: "../../other/three/obj/veyron/parts/veyron_body_bin.js",
	      callback: function(bodyGeometry){
	      var r = "../../other/three/textures/cube/Bridge2/";
	      var urls = [ r + "posx.jpg", r + "negx.jpg",
			   r + "posy.jpg", r + "negy.jpg",
			   r + "posz.jpg", r + "negz.jpg" ];
	
	      var textureCube = THREE.ImageUtils.loadTextureCube( urls );

	      var s=0.02;

	      bodyGeometry.computeBoundingBox();
	      var bodybb = bodyGeometry.boundingBox;
	      
	      var mesh = new THREE.Mesh(bodyGeometry,
					new THREE.MeshLambertMaterial({color: 0xff6600, envMap: textureCube, combine: THREE.MixOperation, reflectivity: 0.2}) );
	      mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
	      mesh.position.y=0.5;
	      var o = new THREE.Object3D();
	      mesh.castShadow = true;
	      mesh.receiveShadow = true;
	      o.add(mesh);

	      var wmesh = [new THREE.Object3D(),
			   new THREE.Object3D(),
			   new THREE.Object3D(),
			   new THREE.Object3D()];
	      wheelGeometry.materials[ 0 ][ 0 ] = new THREE.MeshLambertMaterial({color: 0xffffff, reflectivity:0.75});
	      wheelGeometry.materials[ 1 ][ 0 ] = new THREE.MeshLambertMaterial({color: 0x333333});

	      for(var i=0; i<wmesh.length; i++){
	
		var wheelmesh = new THREE.Mesh(wheelGeometry,new THREE.MeshLambertMaterial({color:0x333333}));
		wheelmesh.scale.set(s,s,s);
		wheelGeometry.computeBoundingBox();
		var bb = wheelGeometry.boundingBox;
		wheelmesh.position.set(-s*(bb.x[1]+bb.x[0])*0.5,
				       -s*(bb.y[1]+bb.y[0])*0.5,
				       -s*(bb.z[1]+bb.z[0])*0.5);
		wheelmesh.castShadow = true;
		wheelmesh.receiveShadow = true;
		wmesh[i].add(wheelmesh);
		wmesh[i].position.set((bodybb.x[1]+bodybb.x[0])*0.5*s,
				      0,
				      0);
		wmesh[i].useQuaternion=true;
		if(i==0 || i==3)
		  wmesh[i].quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI);
		
	      }
	      
	      spawnVehicle(o,wmesh);
	    }
	  });
      }
    });
  
  // Example of setting a callback - overrides old callbacks
  this.keyboardCallback({
      left:function(event,demoapplication){
	gVehicleSteering = 0.3;
      },
      right:function(event,demoapplication){
	gVehicleSteering = -0.3;
      },
      up:function(event,demoapplication){
	gEngineForce = maxEngineForce;
	gBreakingForce = 0.0;
      },
      down:function(event,demoapplication){
	gEngineForce = -0.5*maxEngineForce;
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
  this.m_shapeDrawer.fog(false);
  this.setAzi(70);
  this.setEle(20);
  this.setCameraDistance(27);
  this.clientResetScene();
  this.m_shapeDrawer.update();

  function spawnVehicle(bodyGeometry,wheelGeometries){
    var rightIndex = 0;
    var upIndex = 1; 
    var forwardIndex = 2;
    var wheelDirectionCS0 = new Ammo.btVector3(0,-1,0);
    var wheelAxleCS = new Ammo.btVector3(-1,0,0);

    var CUBE_HALF_EXTENTS = 1.03;
    gEngineForce = 0.0;
    gBreakingForce = 0.0;

    maxEngineForce = 1000.0;//th should be engine/velocity dependent
    maxBreakingForce = 100.0;

    gVehicleSteering = 0.0;
    var steeringIncrement = 0.06;
    var steeringClamp = 0.3;
    var wheelRadius = 0.4;
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

    var chassisShape = new Ammo.btBoxShape(new Ammo.btVector3(1,0.7,2.5));
    m_collisionShapes.push(chassisShape);
  
    var compound = new Ammo.btCompoundShape();
    m_collisionShapes.push(compound);
    var localTrans = new Ammo.btTransform();
    localTrans.setIdentity();

    var tr = new Ammo.btTransform();
    tr.setIdentity();

    // localTrans effectively shifts the center of mass with respect to the chassis
    localTrans.setOrigin(new Ammo.btVector3(0,1.3,0));
    compound.addChildShape(localTrans,chassisShape);
    tr.setOrigin(new Ammo.btVector3(-6,0,-6));

    var options = {threemesh:new THREE.Object3D()};
    options.threemesh.add(bodyGeometry);
  
    var m_carChassis = th.localCreateRigidBody(50,tr,compound,options);
    //m_carChassis.setDamping(0.2,0.2);
  
    var m_wheelShape = new Ammo.btCylinderShapeX(new Ammo.btVector3(wheelWidth,wheelRadius,wheelRadius));
  
    // --- create vehicle ---
    var m_tuning = new Ammo.btVehicleTuning();
    var m_vehicleRayCaster = new Ammo.btDefaultVehicleRaycaster(th.getDynamicsWorld());
    m_vehicle = new Ammo.btRaycastVehicle(m_tuning, m_carChassis, m_vehicleRayCaster);

    ///never deactivate the vehicle
    m_carChassis.setActivationState(th.DISABLE_DEACTIVATION);
    var connectionHeight = 1.3;
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
    th.addVehicle(m_vehicle,m_wheelShape,{threemeshes:wheelGeometries});
  }
};

// Executed every time step
MyDemoApplication.prototype.clientMoveAndDisplay = function(){
  if(m_vehicle){
    m_vehicle.applyEngineForce(gEngineForce,2);
    m_vehicle.setBrake(gBreakingForce,2);
    m_vehicle.applyEngineForce(gEngineForce,3);
    m_vehicle.setBrake(gBreakingForce,3);
    m_vehicle.setSteeringValue(gVehicleSteering,0);
    m_vehicle.setSteeringValue(gVehicleSteering,1);

    for(i=0;i<m_vehicle.getNumWheels();i++){
      // synchronize the wheels with the (interpolated) chassis worldtransform
      m_vehicle.updateWheelTransform(i,true);
    }
  }

  var ms = this.getDeltaTimeMicroseconds();
  var minFPS = 1000000.0/60.0;
  if(ms > minFPS)
    ms = minFPS;
  
  if(this.m_dynamicsWorld)
    this.m_dynamicsWorld.stepSimulation(ms / 1000000.0);
};
