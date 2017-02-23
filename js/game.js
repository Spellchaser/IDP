if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, raycaster = new THREE.Raycaster(), stats;

var camera, scene, renderer, composer, controls, controlsEnabled, velocity, acceleration;
var blocker, instructions;

var loader;
var audioListener, soundFilter, soundAreaAnalyser, soundOutsideAnalyser;
var soundArea, collisionArea, lightArea, lightOutside;

var objects = [], ambientLight;

var edge = 1000;
var clock = new THREE.Clock();
var ticks = 0;

var cowsfound = 0;

// Initialize Three.JS

init();
animate();

/*
loader.onComplete = function( e ) {

	audioListener = loader.audioListener;

	// sound filter

	soundFilter = audioListener.context.createBiquadFilter();
	soundFilter.type = 'lowpass';
	soundFilter.Q.value = 10;
	soundFilter.frequency.value = 440;

	// sound asset 1

	lightOutside = loader.getLight("Light1");

	soundOutside = loader.getSound3D("Point001");
	soundOutsideAnalyser = new THREE.AudioAnalyser( soundOutside, 32 );

	// sound asset 2 + area

	lightArea = loader.getLight("Light2");

	soundArea = loader.getSound3D("Point002");
	soundAreaAnalyser = new THREE.AudioAnalyser( soundArea, 512 );

	collisionArea = loader.getMesh("Torus003");

	animate();

};
*/

function checkmoo(event){
	console.log("Check Moo");
	
	var intersections = raycaster.intersectObjects( objects );
	
	if (intersections.length) {
		cowsfound++;
		
		// Ask the browser to release the pointer
		document.exitPointerLock = document.exitPointerLock ||
			   document.mozExitPointerLock ||
			   document.webkitExitPointerLock;
		document.exitPointerLock();
		
		info = document.getElementById( 'info' );
		info.innerHTML = cowsfound <= 1 ? cowsfound + " moo" : cowsfound + " moos";
		
		controls.getObject().position.set(
			Math.floor(Math.random() * (2*edge)) - edge,
			Math.floor(Math.random() * (2*edge)) - edge,
			Math.floor(Math.random() * (2*edge)) - edge)
	
	}
	//check distance
	//increment/update
	//start new round
}

// Acquire Pointer Lock

function initPointerLock() {

	blocker = document.getElementById( 'blocker' );
	instructions = document.getElementById( 'instructions' );
	info = document.getElementById( 'info' );

	// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

	var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	if ( havePointerLock ) {

		var element = document.body;

		var pointerlockchange = function ( event ) {

			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

				controlsEnabled = true;
				controls.enabled = true;
				
				var delta = clock.getDelta(); // Added to prevent movement
				
				blocker.style.display = 'none';
				
				document.addEventListener( 'onmousedown', checkmoo, false);
				console.log("Acquired");

			} else {

				controls.enabled = false;
				
				var delta = clock.getDelta(); // Added to prevent movement

				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';

				instructions.style.display = '';
				console.log("Paused");
				document.removeEventListener( 'onmousedown', checkmoo, false);

			}

		};

		var pointerlockerror = function ( event ) {

			instructions.style.display = '';

		};

		// Hook pointer lock state change events
		document.addEventListener( 'pointerlockchange', pointerlockchange, false );
		document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
		document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

		document.addEventListener( 'pointerlockerror', pointerlockerror, false );
		document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
		document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

		instructions.addEventListener( 'click', function ( event ) {

			instructions.style.display = 'none';

			// Ask the browser to lock the pointer
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();

		}, false );

	} else {

		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

	}

}

// Audio 
/*
if (window.hasOwnProperty('AudioContext') && !window.hasOwnProperty('webkitAudioContext'))
    window.webkitAudioContext = AudioContext;

var context = new webkitAudioContext();

var Sound = function ( radius, volume ) {

  var source = context.createBufferSource();
  var osc = context.createOscillator();
  var oscGain =context.createGainNode();
  osc.type = 0;

  osc.connect(oscGain);
  oscGain.connect(context.destination);
  osc.noteOn(0); 
  osc.frequency.value = 500;
  oscGain.gain.value = 0;

  this.position = new THREE.Vector3();

  this.update = function ( camera ) {
    var distance = this.position.distanceTo( camera.position );
    if ( distance <= radius ) {
      oscGain.gain.value = volume * ( 1 - distance / radius );

      material_sky.color.setHSL(distance / radius / 2 ,0.666,0.666);
    } else {
      oscGain.gain.value = 0;
    }
  }
}
*/

function init() {
	initPointerLock();

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2( 0x000000, 0.0025 );
	
	ambientLight = new THREE.AmbientLight(0xffffff);
	scene.add(ambientLight); 
	
	velocity = new THREE.Vector3();
	acceleration = new THREE.Vector3();

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	
	//Camera:
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	// Args(FOV, Aspect Ratio, Near clipping plane, Far clipping plane)
	
	controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );

	controls.getObject().translateX( 250 );
	controls.getObject().translateZ( 250 );
	
	var listener = new THREE.AudioListener(); // instantiate a listener
	camera.add( listener ); // add the listener to the camera
	
	var sound = new THREE.PositionalAudio( listener );
	
	// instantiate a loader
	var loader = new THREE.AudioLoader();

	// load a resource
	loader.load(
		// resource URL
		'./media/sounds/0.mp3',
		// Function when resource is loaded
		function ( audioBuffer ) {
			// set the audio object buffer to the loaded object
			sound.setBuffer( audioBuffer );
			sound.setRefDistance( 100 );
			sound.setLoop(true);

			// play the audio
			sound.play();
		},
		// Function called when download progresses
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},
		// Function called when download errors
		function ( xhr ) {
			console.log( 'An error happened' );
		}
	);
	
	vector = new THREE.Vector3(0, 0, -1);
	vector = camera.localToWorld(vector);
	vector.sub(camera.position); // Now vector is a unit vector with the same direction as the camera

	raycaster = new THREE.Raycaster( camera.position, vector, 0, 30);
	
				// floor

				geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
				geometry.rotateX( - Math.PI / 2 );

				for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

					var vertex = geometry.vertices[ i ];
					vertex.x += Math.random() * 20 - 10;
					vertex.y += Math.random() * 2;
					vertex.z += Math.random() * 20 - 10;

				}

				for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

					var face = geometry.faces[ i ];
					face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

				}

				material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

				mesh = new THREE.Mesh( geometry, material );
				scene.add( mesh );

				// objects

				geometry = new THREE.BoxGeometry( 20, 20, 20 );

				for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

					var face = geometry.faces[ i ];
					face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

				}

				for ( var i = 0; i < 1; i ++ ) {

					material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

					var mesh = new THREE.Mesh( geometry, material );
					mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
					mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
					mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
					
					mesh.add(sound);
					scene.add( mesh );

					material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					material.transparent = true;
					material.opacity = 0.51;

					objects.push( mesh );

				}

				//

				renderer = new THREE.WebGLRenderer();
				renderer.setClearColor( 0x333333, 1 );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.appendChild( renderer.domElement );

				//
				stats = new Stats();
				container.appendChild( stats.dom );
	/*
	//Renderer:
	renderer = Detector.webgl? new THREE.WebGLRenderer({ antialias: true }): errorMessage();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0x333333, 1 );
	container.appendChild( renderer.domElement );

	stats = new Stats();
	container.appendChild( stats.dom );

	// post-processing

	composer = new THREE.EffectComposer( renderer );

	var renderPass = new THREE.RenderPass( scene, camera );
	var copyPass = new THREE.ShaderPass( THREE.CopyShader );
	composer.addPass( renderPass );

	var vh = 1.4, vl = 1.2;

	composer.addPass( copyPass );
	copyPass.renderToScreen = true;
	
	*/

	// events

	addEventListeners();

}

//

function animateCamera( delta ) {

	var scale = 10, maxf = 10, minf = 3, maxa = 50;
	
	// Friction/Drift from space particles 
	velocity.x -= velocity.x * (Math.floor(Math.random() * (maxf - minf + 1)) + minf) * delta;
	velocity.y -= velocity.y * (Math.floor(Math.random() * (maxf - minf + 1)) + minf) * delta;
	velocity.z -= velocity.z * (Math.floor(Math.random() * (maxf - minf + 1)) + minf) * delta;
	
	// Player Move with decay
	if ( moveLeft ) acceleration.x -= scale * delta;
		else acceleration.x += scale*.01 * delta;
	if ( moveRight ) acceleration.x += scale * delta;
		else acceleration.x -= scale*.01 * delta;
	if ( moveDown ) acceleration.y -= scale * delta;
		else acceleration.y += scale*.01 * delta;
	if ( moveUp ) acceleration.y += scale * delta;
		else acceleration.y -= scale*.01 * delta;
	if ( moveForward ) acceleration.z -= scale * delta;
		else acceleration.z += scale*.01 * delta;
	if ( moveBackward ) acceleration.z += scale * delta;
		else acceleration.z -= scale*.01 * delta;
	
	// Limit acc
	acceleration.x = acceleration.x >= 0 ? Math.min(maxa, acceleration.x) : Math.max(-maxa, acceleration.x);
	acceleration.y = acceleration.y >= 0 ? Math.min(maxa, acceleration.y) : Math.max(-maxa, acceleration.y);
	acceleration.z = acceleration.z >= 0 ? Math.min(maxa, acceleration.z) : Math.max(-maxa, acceleration.z);

	// Add acc
	velocity.x += acceleration.x;
	velocity.y += acceleration.y;
	velocity.z += acceleration.z;
	
	// Shift camera
	controls.getObject().translateX( velocity.x * delta );
	controls.getObject().translateY( velocity.y * delta );
	controls.getObject().translateZ( velocity.z * delta );
	
	if (controls.getObject().position.x > edge) {
		acceleration.x *= -.35;
		velocity.x *= -1;
		controls.getObject().position.setX(edge + velocity.x * delta);
		console.log("Bounce X");
	} else if (controls.getObject().position.x < -edge) {
		acceleration.x *= -.35;
		velocity.x *= -1;
		controls.getObject().position.setX(-edge + velocity.x * delta);
		console.log("Bounce -X");
	}
	
	if (controls.getObject().position.y > edge) {
		acceleration.y *= -.35;
		velocity.y *= -1;
		controls.getObject().position.setY(edge + velocity.y * delta);
		console.log("Bounce Y");
	} else if (controls.getObject().position.y < -edge) {
		acceleration.y *= -.35;
		velocity.y *= -1;
		controls.getObject().position.setY(-edge + velocity.y * delta);
		console.log("Bounce -Y");
	}

	if (controls.getObject().position.z > edge) {
		acceleration.z *= -.35;
		velocity.z *= -1;
		controls.getObject().position.setZ(edge + velocity.z * delta);
		console.log("Bounce Z");
	} else if (controls.getObject().position.z < -edge) {
		acceleration.z *= -.35;
		velocity.z *= -1;
		controls.getObject().position.setZ(-edge + velocity.z * delta);
		console.log("Bounce -Z");
	}
	//console.log(velocity);
	//console.log(acceleration);
}

var audioPos = new THREE.Vector3();
var audioRot = new THREE.Euler();
/*
function updateSoundFilter() {

	// difference position between sound and listener
	var difPos = new THREE.Vector3().setFromMatrixPosition( soundArea.matrixWorld ).sub(audioPos);
	var length = difPos.length();

	// pick a vector from camera to sound
	raycaster.set( audioPos, difPos.normalize() );

	// intersecting sound1
	if ( length > 50 && raycaster.intersectObjects( [collisionArea] ).length ) {

		if ( soundArea.getFilters()[0] !== soundFilter ) soundArea.setFilters( [ soundFilter ] );

	} else if ( soundArea.getFilters()[0] === soundFilter ) {

		soundArea.setFilters( [] );

	}

}
*/

//

function animate() {
	ticks++;
	
	var delta = clock.getDelta();

	if ( controlsEnabled ) { animateCamera( delta ); }

	/*
	// Sound3D Spatial Transform Update
	loader.audioListener.position.copy( audioPos.setFromMatrixPosition( camera.matrixWorld ) );
	loader.audioListener.rotation.copy( audioRot.setFromRotationMatrix( camera.matrixWorld ) );

	// Update sound filter from raycaster intersecting
	updateSoundFilter();

	// light intensity from sound amplitude
	lightOutside.intensity = soundOutsideAnalyser.getAverageFrequency() / 100;
	lightArea.intensity = soundAreaAnalyser.getAverageFrequency() / 50;

	// Update SEA3D Animations
	THREE.SEA3D.AnimationHandler.update( delta );
	*/
	
	// Change intensity of ambient light
	var frequency = .01; // set by distance 
	var amplitude = 127;
	var center = 128;
	var value = Math.sin(frequency*ticks) * amplitude + center;
	ambientLight.color.set( (value << 16) + (value << 8) + value );
	//console.log(ambientLight.color);
	
	renderer.render( scene, camera );

	stats.update();

	requestAnimationFrame( animate );
	
}
/*
function render( delta ) {

	//renderer.render( scene, camera );
	composer.render( delta );

}
*/