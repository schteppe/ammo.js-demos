function MyDemoApplication(options){
  // Apply "super" constructor
  DemoApplication.apply(this,arguments);
}

// Extend the DemoApplication object
$.extend(MyDemoApplication.prototype,
	 DemoApplication.prototype);

// This function sets up the physics scene.
MyDemoApplication.prototype.initPhysics = function(){

  // Setup collision detection
  var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
  var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  var overlappingPairCache = new Ammo.btDbvtBroadphase();

  // Setup solver and world
  var solver = new Ammo.btSequentialImpulseConstraintSolver();
  this.m_dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
  this.m_dynamicsWorld.setGravity(this.tVec(0, -9.82, 0)); // DemoApplication.prototype.tVec(x,y,z) is a function that returns a temporary Ammo.btVector3, which is allocated by the DemoApplication. This way we don't need to use the "new" operator all the time and this improves performance. Don't use it for anything else than temporary things like this though.

  // Create ground plate in the center of the scene
  var groundShape = new Ammo.btBoxShape(this.tVec(6, 0.5, 6));
  var groundTransform = new Ammo.btTransform();
  groundTransform.setIdentity();
  groundTransform.setOrigin(this.tVec(0, -1.0, 0));
  var ground = this.localCreateRigidBody(0, groundTransform, groundShape);

  // Create infinite ground plane 50 meters down. This is to make sure things don't fall down to infinity and irritate our collision detection
  var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), -50);
  var aabbTransform = new Ammo.btTransform();
  aabbTransform.setIdentity();
  this.localCreateRigidBody(0, aabbTransform, aabbShape);

  // Example of setting a callback - overrides old callbacks
  this.keyboardCallback({'k':function(event,demoapplication){
    alert('You pressed k!');
  }});

  // Reset scene
  this.clientResetScene();
};

// Executed every time step
MyDemoApplication.prototype.clientMoveAndDisplay = function(){
  var ms = this.getDeltaTimeMicroseconds();
  var minFPS = 1000000.0/60.0;
  if(ms > minFPS)
    ms = minFPS;
  
  if(this.m_dynamicsWorld)
    this.m_dynamicsWorld.stepSimulation(ms / 1000000.0);
};
