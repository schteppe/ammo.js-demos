function MyDemoApplication(options){
  // Apply super constructor
  DemoApplication.apply(this,arguments);
}

// Extend prototype methods
$.extend(MyDemoApplication.prototype,
	 DemoApplication.prototype);

MyDemoApplication.prototype.initPhysics = function(){
  // Bullet-interfacing code
  var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  var overlappingPairCache = new Ammo.btDbvtBroadphase();
  //var overlappingPairCache = new Ammo.btAxisSweep3(new Ammo.btVector3(-10,-10,-10),new Ammo.btVector3(10,10,10));

  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  this.m_dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  //this.m_dynamicsWorld.getSolverInfo().set_m_numIterations(10);
  this.m_dynamicsWorld.setGravity(this.tVec(0, -9.82, 0));

  var r = new RagDoll(this,
		      this.tVec(0,0,0));

  // Create ground
  var groundShape = new Ammo.btBoxShape(this.tVec(6, 0.5, 6));
  var groundTransform = new Ammo.btTransform();
  groundTransform.setIdentity();
  groundTransform.setOrigin(this.tVec(0, -1.0, 0));
  var ground = this.localCreateRigidBody(0, groundTransform, groundShape);

  // Create infinite ground plane
  var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), 0);
  var aabbTransform = new Ammo.btTransform();
  aabbTransform.setIdentity();
  this.localCreateRigidBody(0, aabbTransform, aabbShape);

  // Set keyboard actions
  var th = this;
  this.keyboardCallback({e:function(e,da){
	console.log("Pressed e");
	var r = new RagDoll(th,th.tVec(0,0,0));
      }
    });

  // Reset scene
  this.clientResetScene();
};

MyDemoApplication.prototype.clientMoveAndDisplay = function(){
  // Simple dynamics world doesn't handle fixed-time-stepping
  var ms = this.getDeltaTimeMicroseconds();
  var minFPS = 1000000.0/60.0;
  if(ms > minFPS)
    ms = minFPS;
  
  if(this.m_dynamicsWorld)
    this.m_dynamicsWorld.stepSimulation(ms / 1000000.0);
};
