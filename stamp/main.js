var scene  	 = new THREE.Scene();
var camera 	 = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube     = new THREE.Mesh( geometry, material );

scene.add( cube );

camera.position.z = 5;

/**
 * animate scene if necessary
 */
function animate() {

	//request that animate be called next time right
	//before browser is ready to repaint the scene
	requestAnimationFrame( animate );

	cube.rotation.x += 0.1;
	cube.rotation.y += 0.1;

	render();

};

/**
 * render scene
 */
function render() {

	renderer.render( scene, camera );

}

/**
 * Load data from JSON file
 */
$(document).ready(function() {

	$.getJSON( 'projects', function( data ) {
		debugger
		animate();

	});

});
