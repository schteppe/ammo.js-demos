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
  this.m_dynamicsWorld.setGravity(this.tVec(0, -9.82, 0));


  // --- Create 2-box pendulum, using two hinge constraints ---
  // Create boxes
  var boxShape1 = new Ammo.btBoxShape(this.tVec(0.2, 1, 0.2));
  var boxTrans1 = new Ammo.btTransform();
  boxTrans1.setIdentity();
  boxTrans1.setOrigin(this.tVec(0, 1.0, 0));
  var box1 = this.localCreateRigidBody(1, boxTrans1, boxShape1);
  var boxShape2 = new Ammo.btBoxShape(this.tVec(0.2, 1, 0.2));
  var boxTrans2 = new Ammo.btTransform();
  boxTrans2.setIdentity();
  boxTrans2.setOrigin(this.tVec(1, 3.0, 0));
  var box2 = this.localCreateRigidBody(1, boxTrans2, boxShape2);
  // 1st constructor
  var hinge1 = new Ammo.btHingeConstraint(box1,
					  box2,
					  new Ammo.btVector3(0,1,0),
					  new Ammo.btVector3(0,-1,0),
					  new Ammo.btVector3(0,0,1),
					  new Ammo.btVector3(0,0,1),
					  false);
  // 2nd constructor
  var hinge2 = new Ammo.btHingeConstraint(box2,
					  new Ammo.btVector3(0,1,0),
					  new Ammo.btVector3(0,0,1),
					  false);
  this.m_dynamicsWorld.addConstraint(hinge1, true);
  this.m_dynamicsWorld.addConstraint(hinge2, true);

  // Create infinite ground plane
  var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), -1);
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
  this.setCameraDistance(27);
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
