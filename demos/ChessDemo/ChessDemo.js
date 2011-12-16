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
  this.m_dynamicsWorld.setGravity(this.tVec(0, -20, 0));

  // Temp transform
  var transform = new Ammo.btTransform();
  var r = "models/";

  // Load board
  loader = new THREE.ColladaLoader();
  loader.load( r+"chessboard.dae", function colladaReady( collada ){
      dae = collada.scene;
      dae.scale.x = dae.scale.y = dae.scale.z = 1;
      dae.position.set(0,0,0);
      dae.rotation.x = -Math.PI/2;
      // Add shadows
      for(var i=0; i<dae.children.length; i++){
	if(dae.children[i].children[0]){
	  dae.children[i].children[0].castShadow = true;
	  dae.children[i].children[0].receiveShadow = true;
	  dae.children[i].children[0].frustumCulled = false;
	}
      }
      dae.children[0].children[0].geometry.computeBoundingBox();
      var bb = dae.children[0].children[0].geometry.boundingBox;
      dae.position.set(-0.5*(bb.x[1]+bb.x[0]),
		       -0.5*(bb.y[1]+bb.y[0])+0.65,
		       -0.5*(bb.z[1]+bb.z[0]));
      // "root" container
      var o = new THREE.Object3D();
      o.add(dae);

      transform.setIdentity();
      transform.setOrigin(th.tVec(0,
				  -0.8,
				  0));
      var shape = new Ammo.btBoxShape(th.tVec(6.2,0.65,6.2));
      var body = th.localCreateRigidBody(0,transform,shape,{threemesh:o});

      // Border 1
      transform.setIdentity();
      transform.setOrigin(th.tVec(0,-0.65,-5.9));
      var shape = new Ammo.btBoxShape(th.tVec(6.2,0.75,0.3));
      var body = th.localCreateRigidBody(0,transform,shape,{threemesh:new THREE.Object3D()});

      // Border 2
      transform.setIdentity();
      transform.setOrigin(th.tVec(0,-0.65,5.9));
      var shape = new Ammo.btBoxShape(th.tVec(6.2,0.75,0.3));
      var body = th.localCreateRigidBody(0,transform,shape,{threemesh:new THREE.Object3D()});

      // Border 3
      transform.setIdentity();
      transform.setOrigin(th.tVec(5.9,-0.65,0));
      var shape = new Ammo.btBoxShape(th.tVec(0.3,0.75,6.2));
      var body = th.localCreateRigidBody(0,transform,shape,{threemesh:new THREE.Object3D()});

      // Border 4
      transform.setIdentity();
      transform.setOrigin(th.tVec(-5.9,-0.65,0));
      var shape = new Ammo.btBoxShape(th.tVec(0.3,0.75,6.2));
      var body = th.localCreateRigidBody(0,transform,shape,{threemesh:new THREE.Object3D()});
    });  

  // Load models
  var s = 1.4;
  var colors = [0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0xffffff,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333,
		0x333333];

  var models = [// White
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",

		r+"rook.dae",
		r+"rook.dae",

		r+"bishop.dae",
		r+"bishop.dae",

		r+"king.dae",
		r+"queen.dae",

		r+"knight.dae",
		r+"knight.dae",

		// Black
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",
		r+"pawn.dae",

		r+"rook.dae",
		r+"rook.dae",

		r+"bishop.dae",
		r+"bishop.dae",

		r+"king.dae",
		r+"queen.dae",

		r+"knight.dae",
		r+"knight.dae"];

  var heights = [// White
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,

		 1.05,
		 1.05,

		 1.25,
		 1.25,

		 1.48,
		 1.48,

		 1.05,
		 1.05,

		 // Black
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,
		 0.95,

		 1.05,
		 1.05,

		 1.25,
		 1.25,

		 1.48,
		 1.48,

		 1.05,
		 1.05];

  var pos2d =  [
		// White
		// Pawns
		[0*s,s],
		[1*s,s],
		[2*s,s],
		[3*s,s],
		[4*s,s],
		[5*s,s],
		[6*s,s],
		[7*s,s],

		[0*s,0*s],
		[7*s,0*s],

		[2*s,0*s],
		[5*s,0*s],

		[3*s,0*s],
		[4*s,0*s],

		[1*s,0*s],
		[6*s,0*s],

		// Black Pawns
		[0*s,6*s],
		[1*s,6*s],
		[2*s,6*s],
		[3*s,6*s],
		[4*s,6*s],
		[5*s,6*s],
		[6*s,6*s],
		[7*s,6*s],

		[0*s,7*s],
		[7*s,7*s],

		[2*s,7*s],
		[5*s,7*s],

		[3*s,7*s],
		[4*s,7*s],

		[1*s,7*s],
		[6*s,7*s]];

  // "root" container
  var r = "../../other/three/textures/cube/chess/";
  var urls = [ r + "posx.jpg", r + "posx.jpg",
	       r + "posy.jpg", r + "negy.jpg",
	       r + "posx.jpg", r + "posx.jpg" ];
  var texCube = THREE.ImageUtils.loadTextureCube( urls );
  
  for(var mi = 0; mi<models.length; mi++)
    loadPiece(models[mi],pos2d[mi],heights[mi],colors[mi],texCube);

  function loadPiece(filename,pos,height,color,texCube){
    var loader = new THREE.ColladaLoader();
    loader.load( filename, function colladaReady( collada ){
	dae = collada.scene;
	dae.scale.x = dae.scale.y = dae.scale.z = 1;
	dae.position.set(0,0,0);
	dae.rotation.x = -Math.PI/2;
	dae.children[0].children[0].geometry.computeBoundingBox();
	var bb = dae.children[0].children[0].geometry.boundingBox;
	dae.position.set(-0.5*(bb.x[1]+bb.x[0]),
			 -0.5*(bb.y[1]+bb.y[0]),
			 -0.5*(bb.z[1]+bb.z[0]));
	
	for(var i=0; i<dae.children.length; i++){
	  dae
	    .children[i]
	    .children[0] = new THREE.Mesh(dae.children[i].children[0].geometry,
					  new THREE.MeshLambertMaterial({color: color,
									 envMap: texCube,
									 combine: THREE.MixOperation,
									 reflectivity: 0.2}));
	    dae.children[i].children[0].castShadow = true;
	    dae.children[i].children[0].receiveShadow = true;
	    dae.children[i].children[0].frustumCulled = false;
	}
	
	var o = new THREE.Object3D();
	o.add(dae);

	transform.setIdentity();
	transform.setOrigin(th.tVec(pos[0]-5,
				    height/2,
				    pos[1]-5));
	var shape = new Ammo.btConeShape(0.24,
					 height);
	var body = th.localCreateRigidBody(10,transform,shape,{threemesh:o});
	body.setDamping(0.3,0.3);
      });  
  }

  // Create infinite ground plane
  var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), -1.5);
  var aabbTransform = new Ammo.btTransform();
  aabbTransform.setIdentity();
  this.localCreateRigidBody(0, aabbTransform, aabbShape);

  // Reset scene
  this.m_shapeDrawer.fog(false);
  this.setAzi(230);
  this.setEle(20);
  this.setCameraDistance(27);
  this.clientResetScene();
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
