function RagDoll(da,positionOffset){

  var BODYPART_PELVIS=0;
  var BODYPART_SPINE=1;
  var BODYPART_HEAD=2;
  var BODYPART_LEFT_UPPER_LEG=3;
  var BODYPART_LEFT_LOWER_LEG=4;
  var BODYPART_RIGHT_UPPER_LEG=5;
  var BODYPART_RIGHT_LOWER_LEG=6;
  var BODYPART_LEFT_UPPER_ARM=7;
  var BODYPART_LEFT_LOWER_ARM=8;
  var BODYPART_RIGHT_UPPER_ARM=9;
  var BODYPART_RIGHT_LOWER_ARM=10;
  var BODYPART_COUNT=11;

  var JOINT_PELVIS_SPINE=0;
  var JOINT_SPINE_HEAD=1;
  var JOINT_LEFT_HIP=2;
  var JOINT_LEFT_KNEE=3;
  var JOINT_RIGHT_HIP=4;
  var JOINT_RIGHT_KNEE=5;
  var JOINT_LEFT_SHOULDER=6;
  var JOINT_LEFT_ELBOW=7;
  var JOINT_RIGHT_SHOULDER=8;
  var JOINT_RIGHT_ELBOW=9;
  var JOINT_COUNT=10;

  var CONSTRAINT_DEBUG_SIZE = 0.1;

  var m_ownerWorld = this.m_ownerWorld = da.getDynamicsWorld();
  var m_shapes = this.m_shapes = []; // BODYPART_COUNT
  var m_bodies = this.m_bodies = []; // BODYPART_COUNT
  var m_joints = this.m_joints = []; // JOINT_COUNT
  for(var i=0; i<BODYPART_COUNT; i++){
    m_shapes.push(null);
    m_bodies.push(null);
  }
  for(var i=0; i<JOINT_COUNT; i++){
    m_joints.push(null);
  }
  
  // Setup the geometry
  m_shapes[BODYPART_PELVIS] = new Ammo.btCapsuleShape((0.15), (0.20));
  m_shapes[BODYPART_SPINE] = new Ammo.btCapsuleShape((0.15), (0.28));
  m_shapes[BODYPART_HEAD] = new Ammo.btCapsuleShape((0.10), (0.05));
  m_shapes[BODYPART_LEFT_UPPER_LEG] = new Ammo.btCapsuleShape((0.07), (0.45));
  m_shapes[BODYPART_LEFT_LOWER_LEG] = new Ammo.btCapsuleShape((0.05), (0.37));
  m_shapes[BODYPART_RIGHT_UPPER_LEG] = new Ammo.btCapsuleShape((0.07), (0.45));
  m_shapes[BODYPART_RIGHT_LOWER_LEG] = new Ammo.btCapsuleShape((0.05), (0.37));
  m_shapes[BODYPART_LEFT_UPPER_ARM] = new Ammo.btCapsuleShape((0.05), (0.33));
  m_shapes[BODYPART_LEFT_LOWER_ARM] = new Ammo.btCapsuleShape((0.04), (0.25));
  m_shapes[BODYPART_RIGHT_UPPER_ARM] = new Ammo.btCapsuleShape((0.05), (0.33));
  m_shapes[BODYPART_RIGHT_LOWER_ARM] = new Ammo.btCapsuleShape((0.04), (0.25));

  // Setup all the rigid bodies
  var offset = new Ammo.btTransform(); offset.setIdentity();
  offset.setOrigin(positionOffset);

  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.), (1.), (0.)));
  transform.op_mul(offset);
  m_bodies[BODYPART_PELVIS] = da.localCreateRigidBody((1.),transform,m_shapes[BODYPART_PELVIS]);
  
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.), (1.2), (0.)));
  transform.op_mul(offset)
  m_bodies[BODYPART_SPINE] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_SPINE]);
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.), (1.6), (0.)));
  transform.op_mul(offset);
  m_bodies[BODYPART_HEAD] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_HEAD]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((-0.18), (0.65), (0.)));
  transform.op_mul(offset);
  m_bodies[BODYPART_LEFT_UPPER_LEG] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_LEFT_UPPER_LEG]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((-0.18), (0.2), (0.)));
  transform.op_mul(offset);
  m_bodies[BODYPART_LEFT_LOWER_LEG] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_LEFT_LOWER_LEG]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.18), (0.65), (0.)));
  transform.op_mul(offset);
  m_bodies[BODYPART_RIGHT_UPPER_LEG] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_RIGHT_UPPER_LEG]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.18), (0.2), (0.)));
  transform.op_mul(offset);
  m_bodies[BODYPART_RIGHT_LOWER_LEG] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_RIGHT_LOWER_LEG]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((-0.35), (1.45), (0.)));
  transform.getBasis().setEulerZYX(0,0,Math.PI/2);
  transform.op_mul(offset);
  m_bodies[BODYPART_LEFT_UPPER_ARM] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_LEFT_UPPER_ARM]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((-0.7), (1.45), (0.)));
  transform.getBasis().setEulerZYX(0,0,Math.PI/2);
  transform.op_mul(offset);
  m_bodies[BODYPART_LEFT_LOWER_ARM] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_LEFT_LOWER_ARM]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.35), (1.45), (0.)));
  transform.getBasis().setEulerZYX(0,0,-Math.PI/2);
  transform.op_mul(offset);
  m_bodies[BODYPART_RIGHT_UPPER_ARM] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_RIGHT_UPPER_ARM]);

  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3((0.7), (1.45), (0.)));
  transform.getBasis().setEulerZYX(0,0,-Math.PI/2);
  transform.op_mul(offset);
  m_bodies[BODYPART_RIGHT_LOWER_ARM] = da.localCreateRigidBody((1.), transform, m_shapes[BODYPART_RIGHT_LOWER_ARM]);

  // Setup some damping on the m_bodies
  for(var i=0; i<BODYPART_COUNT; i++){
    m_bodies[i].setDamping(0.05, 0.85);
    m_bodies[i].setDeactivationTime(0.8);
    m_bodies[i].setSleepingThresholds(1.6, 2.5);
  }

  // Now setup the constraints
  //var hingeC = new Ammo.btHingeConstraint();
  //var coneC = new Ammo.btConeTwistConstraint();

  var localA = new Ammo.btTransform();
  var localB = new Ammo.btTransform();
  /*
  localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,Math.PI/2,0); localA.setOrigin(new Ammo.btVector3((0.), (0.15), (0.)));
  localB.getBasis().setEulerZYX(0,Math.PI/2,0); localB.setOrigin(new Ammo.btVector3((0.), (-0.15), (0.)));
  var hingeC = new Ammo.btHingeConstraint(m_bodies[BODYPART_PELVIS], m_bodies[BODYPART_SPINE], localA, localB);
  hingeC.setLimit((-Math.PI/4), (Math.PI/2));
  */

  var hingeC = new Ammo.btHingeConstraint(m_bodies[BODYPART_PELVIS],
					   m_bodies[BODYPART_SPINE],
					   new Ammo.btVector3(0,0.15,0),
					   new Ammo.btVector3(0,-0.15,0),
					   new Ammo.btVector3(0,0,0.15),
					   new Ammo.btVector3(0,0,0.15));
  m_joints[JOINT_PELVIS_SPINE] = hingeC;
  hingeC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_PELVIS_SPINE], true);

  localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,0,Math.PI/2); localA.setOrigin(new Ammo.btVector3((0.), (0.30), (0.)));
  localB.getBasis().setEulerZYX(0,0,Math.PI/2); localB.setOrigin(new Ammo.btVector3((0.), (-0.14), (0.)));
  var coneC = new Ammo.btConeTwistConstraint(m_bodies[BODYPART_SPINE], m_bodies[BODYPART_HEAD], localA, localB);
  coneC.setLimit(Math.PI/4, Math.PI/4, Math.PI/2);
  m_joints[JOINT_SPINE_HEAD] = coneC;
  coneC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_SPINE_HEAD], true);


  localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,0,-Math.PI/4*5); localA.setOrigin(new Ammo.btVector3((-0.18), (-0.10), (0.)));
  localB.getBasis().setEulerZYX(0,0,-Math.PI/4*5); localB.setOrigin(new Ammo.btVector3((0.), (0.225), (0.)));
  coneC = new Ammo.btConeTwistConstraint(m_bodies[BODYPART_PELVIS], m_bodies[BODYPART_LEFT_UPPER_LEG], localA, localB);
  coneC.setLimit(Math.PI/4, Math.PI/4, 0);
  m_joints[JOINT_LEFT_HIP] = coneC;
  coneC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_LEFT_HIP], true);

  /*localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,Math.PI/2,0); localA.setOrigin(new Ammo.btVector3((0.), (-0.225), (0.)));
  localB.getBasis().setEulerZYX(0,Math.PI/2,0); localB.setOrigin(new Ammo.btVector3((0.), (0.185), (0.)));
  hingeC =  new Ammo.btHingeConstraint(m_bodies[BODYPART_LEFT_UPPER_LEG], m_bodies[BODYPART_LEFT_LOWER_LEG], localA, localB);
  hingeC.setLimit((0), (Math.PI/2));
  */
  hingeC =  new Ammo.btHingeConstraint(m_bodies[BODYPART_LEFT_UPPER_LEG],
				       m_bodies[BODYPART_LEFT_LOWER_LEG],
				       new Ammo.btVector3(0,-0.225,0),
				       new Ammo.btVector3(0,0.185,0),
				       new Ammo.btVector3(0,0,0.225),
				       new Ammo.btVector3(0,0,0.185));

  m_joints[JOINT_LEFT_KNEE] = hingeC;
  hingeC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_LEFT_KNEE], true);

  localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,0,Math.PI/4); localA.setOrigin(new Ammo.btVector3((0.18), (-0.10), (0.)));
  localB.getBasis().setEulerZYX(0,0,Math.PI/4); localB.setOrigin(new Ammo.btVector3((0.), (0.225), (0.)));
  coneC = new Ammo.btConeTwistConstraint(m_bodies[BODYPART_PELVIS], m_bodies[BODYPART_RIGHT_UPPER_LEG], localA, localB);
  coneC.setLimit(Math.PI/4, Math.PI/4, 0);
  m_joints[JOINT_RIGHT_HIP] = coneC;
  coneC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_RIGHT_HIP], true);

  /*
    localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,Math.PI/2,0); localA.setOrigin(new Ammo.btVector3((0.), (-0.225), (0.)));
  localB.getBasis().setEulerZYX(0,Math.PI/2,0); localB.setOrigin(new Ammo.btVector3((0.), (0.185), (0.)));
  hingeC =  new Ammo.btHingeConstraint(m_bodies[BODYPART_RIGHT_UPPER_LEG], m_bodies[BODYPART_RIGHT_LOWER_LEG], localA, localB);
  hingeC.setLimit((0), (Math.PI/2));
  */
  hingeC =  new Ammo.btHingeConstraint(m_bodies[BODYPART_RIGHT_UPPER_LEG],
				       m_bodies[BODYPART_RIGHT_LOWER_LEG],
				       new Ammo.btVector3(0,-0.225,0),
				       new Ammo.btVector3(0,0.185,0),
				       new Ammo.btVector3(0,0,0.225),
				       new Ammo.btVector3(0,0,0.185));

  m_joints[JOINT_RIGHT_KNEE] = hingeC;
  hingeC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_RIGHT_KNEE], true);

  localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,0,Math.PI); localA.setOrigin(new Ammo.btVector3((-0.2), (0.15), (0.)));
  localB.getBasis().setEulerZYX(0,0,Math.PI/2); localB.setOrigin(new Ammo.btVector3((0.), (-0.18), (0.)));
  coneC = new Ammo.btConeTwistConstraint(m_bodies[BODYPART_SPINE], m_bodies[BODYPART_LEFT_UPPER_ARM], localA, localB);
  coneC.setLimit(Math.PI/2, Math.PI/2, 0);
  coneC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_joints[JOINT_LEFT_SHOULDER] = coneC;
  m_ownerWorld.addConstraint(m_joints[JOINT_LEFT_SHOULDER], true);

  /*
    localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,Math.PI/2,0); localA.setOrigin(new Ammo.btVector3((0.), (0.18), (0.)));
  localB.getBasis().setEulerZYX(0,Math.PI/2,0); localB.setOrigin(new Ammo.btVector3((0.), (-0.14), (0.)));
  hingeC =  new Ammo.btHingeConstraint(m_bodies[BODYPART_LEFT_UPPER_ARM],
				       m_bodies[BODYPART_LEFT_LOWER_ARM],
				       localA, localB);
  //		hingeC.setLimit((-Math.PI/2), (0));
  hingeC.setLimit((0), (Math.PI/2));
  */
  hingeC =  new Ammo.btHingeConstraint(m_bodies[BODYPART_LEFT_UPPER_ARM],
				       m_bodies[BODYPART_LEFT_LOWER_ARM],
				       new Ammo.btVector3(0,0.18,0),
				       new Ammo.btVector3(0,-0.14,0),
				       new Ammo.btVector3(0,0,0.18),
				       new Ammo.btVector3(0,0,0.14));
  //		hingeC.setLimit((-Math.PI/2), (0));
  hingeC.setLimit(-Math.PI/2,0);
  m_joints[JOINT_LEFT_ELBOW] = hingeC;
  hingeC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_LEFT_ELBOW], true);

  localA.setIdentity(); localB.setIdentity();
  localA.getBasis().setEulerZYX(0,0,0); localA.setOrigin(new Ammo.btVector3((0.2), (0.15), (0.)));
  localB.getBasis().setEulerZYX(0,0,Math.PI/2); localB.setOrigin(new Ammo.btVector3((0.), (-0.18), (0.)));
  coneC = new Ammo.btConeTwistConstraint(m_bodies[BODYPART_SPINE], m_bodies[BODYPART_RIGHT_UPPER_ARM], localA, localB);
  coneC.setLimit(Math.PI/2, Math.PI/2, 0);
  m_joints[JOINT_RIGHT_SHOULDER] = coneC;
  coneC.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_RIGHT_SHOULDER], true);

  /*
  var hingeC1_localA = new Ammo.btTransform();
  hingeC1_localA.setIdentity();
  var b1 = hingeC1_localA.getBasis();
  b1.setEulerZYX(0,Math.PI/2,0);
  hingeC1_localA.setBasis(b1);
  hingeC1_localA.setOrigin(new Ammo.btVector3(0., 0.18, 0.));
  var hingeC1_localB = new Ammo.btTransform();
  hingeC1_localB.setIdentity();
  var b2 = hingeC1_localB.getBasis();
  b2.setEulerZYX(0,Math.PI/2,0);
  hingeC1_localB.setBasis(b2);
  hingeC1_localB.setOrigin(new Ammo.btVector3(0., -0.14, 0.));
  var hingeC1 = new Ammo.btHingeConstraint(m_bodies[BODYPART_RIGHT_UPPER_ARM],
					   m_bodies[BODYPART_RIGHT_LOWER_ARM],			   
					   hingeC1_localA,
					   hingeC1_localB);
  */
  /*hingeC1.setFrames(hingeC1_localA,
    hingeC1_localB);*/

  var hingeC1 = new Ammo.btHingeConstraint(m_bodies[BODYPART_RIGHT_UPPER_ARM],
					   m_bodies[BODYPART_RIGHT_LOWER_ARM],
					   new Ammo.btVector3(0,0.18,0),
					   new Ammo.btVector3(0,-0.14,0),
					   new Ammo.btVector3(0,0,0.18),
					   new Ammo.btVector3(0,0,0.14));
  hingeC1.setLimit(0.0, Math.PI/2);
  //hingeC1.setLimit((-Math.PI/2), (0.0));
  //hingeC.setLimit((0), (Math.PI/2));
  m_joints[JOINT_RIGHT_ELBOW] = hingeC1;
  hingeC1.setDbgDrawSize(CONSTRAINT_DEBUG_SIZE);

  m_ownerWorld.addConstraint(m_joints[JOINT_RIGHT_ELBOW], true);
}
