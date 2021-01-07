import * as THREE from "https://threejs.org/build/three.module.js"
import { CSM } from 'https://threejs.org/examples/jsm/csm/CSM.js'
// Copy Paste

var PointerLockControls = function (camera, domElement) {

  this.domElement = domElement;
  this.isLocked = false;
  var scope = this;
  // Set to constrain the pitch of the camera
  // Range is 0 to Math.PI radians
  this.minPolarAngle = 0; // radians
  this.maxPolarAngle = Math.PI; // radians

  var euler = new THREE.Euler(0, 0, 0, 'YXZ');

  var PI_2 = Math.PI / 2;

  var vec = new THREE.Vector3();

  function onMouseMove(event) {

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    euler.setFromQuaternion(camera.quaternion);

    euler.y -= movementX * 0.002;
    euler.x -= movementY * 0.002;

    euler.x = Math.max(PI_2 - scope.maxPolarAngle, Math.min(PI_2 - scope.minPolarAngle, euler.x));

    camera.quaternion.setFromEuler(euler);


  }
  document.body.addEventListener('mousemove', onMouseMove);


  this.dispose = function () {

    this.disconnect();

  };

  this.getObject = function () { // retaining this method for backward compatibility

    return camera;

  };

  this.getDirection = function () {

    var direction = new THREE.Vector3(0, 0, - 1);

    return function (v) {

      return v.copy(direction).applyQuaternion(camera.quaternion);

    };

  }();

  this.moveForward = function (distance) {

    // move forward parallel to the xz-plane
    // assumes camera.up is y-up

    vec.setFromMatrixColumn(camera.matrix, 0);

    vec.crossVectors(camera.up, vec);

    //	camera.position.addScaledVector( vec, distance );
    var v = Player.getLinearVelocity();
    v.addScaledVector(vec, distance * 10);
    v.clamp(new THREE.Vector3(-10, -100, -10), new THREE.Vector3(10, 60, 10))
    Player.setLinearVelocity(v);
    // Player.position.addScaledVector(vec,distance);
    // Player.__dirtyPosition = true;
  };

  this.moveRight = function (distance) {

    vec.setFromMatrixColumn(camera.matrix, 0);

    //	camera.position.addScaledVector( vec, distance );
    var v = Player.getLinearVelocity();
    v.addScaledVector(vec, distance * 10);
    v.clamp(new THREE.Vector3(-10, -100, -10), new THREE.Vector3(10, 60, 10))
    Player.setLinearVelocity(v);
  };

  this.lock = function () {

    this.domElement.requestPointerLock();

  };

  this.unlock = function () {

    document.exitPointerLock();

  };

};



//physics prep
Physijs.scripts.worker = '/physiworker.js'
Physijs.scripts.ammo = '/ammo.js'
//replace new THREE.Mesh with these..
//If you are making box shapes, use new Physijs.BoxMesh
//Making cylinders > new Physijs.CylinderMesh
//Making spheres > new Physijs.SphereMesh

//WHEN YOU CHANGE POSITION/ROTATION...
//do this!
// object.__dirtyPosition = true;
// object.__dirtyRotation = true;

let keys = [];
let jumpVeloc = 0;
let jumping = false;
let camera, scene, renderer, controls, csm, Player;
function init() {
  scene = new Physijs.Scene;
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  const listener = new THREE.AudioListener();
  camera.add( listener );

  // create the PositionalAudio object (passing in the listener)
  const sound = new THREE.PositionalAudio( listener );
  const audioLoader = new THREE.AudioLoader();
  // load a sound and set it as the PositionalAudio object's buffer
  audioLoader.load( 'audio/calmmusic.wav', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setRefDistance( 5 );
  sound.setLoop( true );
	sound.play();
  });
  
  
  //Light
  csm = new CSM({
    parent: scene,
    mode: 'practical',
    maxFar: camera.far,
    camera: camera,
    shadowMapSize: 2048,
    lightIntensity: .5,
    cascades: 8,
    lightNear: 50,
    lightFar: 500,
    margin: 100,
    fade: true,
    lightDirection: new THREE.Vector3(1, -1, -1).normalize()
  });


  const ambientLight = new THREE.AmbientLight(0xffffff, .0);
  scene.add(ambientLight);
  //const pointLight = new THREE.PointLight( 0xff0000, 1, 5 );
  //pointLight.position.set( 10, 10, 10 );
  //scene.add( pointLight );
  const planeGeo = new THREE.PlaneGeometry(50, 50, 38);

  const planeMaterial = Physijs.createMaterial(
    new THREE.MeshPhongMaterial({ color: 0x6a04b3, side: THREE.DoubleSide }),
    1,0
    );
  
  const plane = new Physijs.BoxMesh(planeGeo, planeMaterial, 0);
  plane.receiveShadow = true;
  scene.add(plane);
  //extra ,0 makes it static
  plane.rotation.x = Math.PI / 2;
  plane.position.set(0, -1, 0)
  plane.__dirtyPosition = true;
  plane.__dirtyRotation = true;
  csm.setupMaterial(plane.material);
  //Instead of degrees, rotation is measured in "radians"
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshPhongMaterial({ color: 0x5100d4 });
  csm.setupMaterial(material)
  //Physijs = correct spelling
  const cube = new Physijs.BoxMesh(geometry, material);
  scene.add(cube);
  cube.castShadow = true;
  cube.receiveShadow = true;
  const stool = new Physijs.BoxMesh(geometry, material, 0);
  stool.position.set(3, 0, 0);
  stool.castShadow = true;
  stool.receiveShadow = true;
  stool.__dirtyPosition = true;
  scene.add(stool)
  const box1 = new Physijs.BoxMesh(geometry, material);
  box1.position.set(3, 1, 0);
  box1.castShadow = true;
  box1.receiveShadow = true;
  box1.__dirtyPosition = true;
  scene.add(box1)
  camera.position.x = cube.position.x + 10;
  camera.position.y = cube.position.y + .5;
  camera.position.z = cube.position.z + 3;
  scene.add(cube);
  controls = new PointerLockControls(camera, renderer.domElement);
  camera.lookAt(cube.position);

  var xSpeed = 0.1;
  var ySpeed = 0.1;
  cube.position.z += .5;
  cube.__dirtyPosition = true;//Do this every time you change pos

  //Player object(invisible,for physics)
  Player = new Physijs.BoxMesh(new THREE.BoxGeometry(1, 2, 1), Physijs.createMaterial(new THREE.MeshBasicMaterial({ opacity: 0, transparent: true }), 1, 0));
  scene.add(Player);
  scene.add(camera);
  Player.position.set(3, 0, 3);
  Player.__dirtyPosition = true;


//  function test() {
  //  cube.applyCentralImpulse(new THREE.Vector3(0, 5, 0));
 //   setTimeout(function () {
   //   cube.applyCentralImpulse(new THREE.Vector3(0, 0, 0));
     // setTimeout(test, 500);
  //  }, 500);
  //}
  //test();
  document.body.addEventListener('mouseup', function () {
    controls.lock();
  })
  document.body.addEventListener('keydown', function (e) {
    keys[e.key] = true;
  })
  document.body.addEventListener('keyup', function (e) {
    keys[e.key] = false;
  })
  animate();
}
// cube.rotation.x += 0.01
// cube.rotation.y += 0.01;
function animate() {
  requestAnimationFrame(animate);
  csm.update();

  if (keys['w']) {
    controls.moveForward(.1);
  }
  if (keys['s']) {
    controls.moveForward(-.1);
  }
  if (keys['d']) {
    controls.moveRight(.1);
  }
  if (keys['a']) {
    controls.moveRight(-.1);
  }
  if(keys[' ']){
    if(jumping==false){
    Player.applyCentralImpulse(new THREE.Vector3(0,1,0));
    }
  }
  if(keys[`
`]){
    if(jumping==false){
    Player.applyCentralImpulse(new THREE.Vector3(0,-1,0));
    console.log("EEEE");
    }
  }
  camera.position.set(Player.position.x,Player.position.y+1,Player.position.z);
  //Bcamera.rotation.set(Player.rotation.x,Player.rotation.y,Player.rotation.z)
  scene.simulate();
  renderer.render(scene, camera);

}
init();//In init we run animate
