////////////////////////////////////////////////////////////////////////////////
// Helix: replace spheres with capsules (cheese logs)
// Your task is to modify the createHelix function
////////////////////////////////////////////////////////////////////////////////
/*global THREE, Coordinates, document, window, dat*/

var camera, scene, renderer;
var cameraControls, effectController;
var clock  = new THREE.Clock();
var gridX  = true;
var gridY  = false;
var gridZ  = false;
var axes   = true;
var ground = true;

var radius 		   = 96;
var sphereRadius   = 6;
var radialSegments = 36;
var height 		   = 300;
//var segmentsWidth  = 24;
var arc  		   = 1.5;

var projects = {};   
var jobsDict = {};
var helices = {};

var selectedJobType;

var wireframes = [];
var selectedProjectName = "";
var numSphereSegments = 24

var numProjects = 0;

var smallJobsUpperBound  = 100;
var mediumJobsUpperBound = 500;
var largeJobsUpperBound  = 16385;

function setupAttributes( geometry ) {

	var vectors = [
		new THREE.Vector3( 1, 0, 0 ),
		new THREE.Vector3( 0, 1, 0 ),
		new THREE.Vector3( 0, 0, 1 )
	];

	var position = geometry.attributes.position;
	var centers  = new Float32Array( position.count * 3 );

	for ( var i = 0, l = position.count; i < l; i ++ ) {

		vectors[ i % 3 ].toArray( centers, i * 3 );

	}

	geometry.addAttribute( 'center', new THREE.BufferAttribute( centers, 3 ) );

}

// Initialize renderer, camera, scene, lighting
function setupScene() {

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: false } );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.setSize(window.innerWidth, window.innerHeight);

	// setClearColorHex() is depricated
	renderer.setClearColor( 0x000000, 1.0 );
	document.body.appendChild( renderer.domElement );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 40, window.innerWidth/window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, 1000);

	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	cameraControls.target.set(0,0,0);
	cameraControls.target.set(0,200,0);

	// SCENE
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );

	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );

	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -500, 250, -200 );

	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);

	// EVENTS
	window.addEventListener( 'resize', onWindowResize, false );

}

// Fill scene with objects, including necessary helices
function fillScene() {

	// Populate jobs lists
	filterJobs(jobsDict);

	// Positon to set each sphere to, incremented before a sphere is added
	var smallTop  = new THREE.Vector3();
	var mediumTop = new THREE.Vector3();
	var largeTop  = new THREE.Vector3();
	var allTop    = new THREE.Vector3();

	console.log("ABOUT TO CREATE SMALL JOBS HELIX");
	var smallJobsHelix 	= createHelix(jobsDict["small"],  smallTop,  0.75*radius, sphereRadius, radialSegments, numSphereSegments, height, 4*arc, false);
	console.log();
	console.log("ABOUT TO CREATE MEDIUM JOBS HELIX");
	var mediumJobsHelix = createHelix(jobsDict["medium"], mediumTop, 0.75*radius, sphereRadius, radialSegments, numSphereSegments, height, 4*arc, false);
	var largeJobsHelix 	= createHelix(jobsDict["large"],  largeTop,  0.75*radius, sphereRadius, radialSegments, numSphereSegments, height, 4*arc, false);
	//var allJobsHelix 	= createHelix(jobsDict["all"],    allTop, 	 0.75*radius, sphereRadius, radialSegments, numSphereSegments, height, 4*arc, false);

	// Add helices to helix dictionary
	helices["small"]  = smallJobsHelix;
	helices["medium"] = mediumJobsHelix;
	helices["large"]  = largeJobsHelix;
	//helices["all"]    = allJobsHelix;

	// Position helixes side by size
	//smallJobsHelix.position.x  = -600;
	// mediumJobsHelix.position.x = 0;
	// largeJobsHelix.position.x  = 600;

	// Add helices to scene
	scene.add( smallJobsHelix );
	scene.add( mediumJobsHelix );
	scene.add( largeJobsHelix );

	// allJobsHelix.position.x = 1200;
	// scene.add(allJobsHelix);

	// Set visibility of hidden helices
	smallJobsHelix.visible = false;
	//mediumJobsHelix.visible = false;
	largeJobsHelix.visible = false;
	// allJobsHelix.visible = false;

}

/**
* Returns a THREE.Object3D helix going from top to bottom positions
* @param jobs 			   - list of jobs to add to helix
* @param top 			   - location to draw each sphere
* @param material 		   - THREE.Material
* @param radius 		   - radius of helix itself
* @param shpereRadius 	   - radius of sphere
* @param radialSegments    - number of capsules around a full circle
* @param numSphereSegments - number of segments in a sphere, used for width and height
* @param height 		   - height to extend, from *center* of sphere ends along Y axis
* @param arc 			   - how many times to go around the Y axis; currently just an integer
* @param clockwise 		   - if true, go counterclockwise up the axis
*/
function createHelix( jobs, top, radius, sphereRadius, radialSegments, numSphereSegments, height, arc, clockwise )
{
	// defaults
	console.log("IN CREATE HELIX");
	numSphereSegments = (numSphereSegments === undefined) ? 32 : numSphereSegments;
	arc = (arc === undefined) ? 1 : arc;
	clockwise = (clockwise === undefined) ? true : clockwise;

	var helix = new THREE.Object3D();

	var sine_sign = clockwise ? 1 : -1;

	// Geometry that can be reused as wireframe geometry
	var sphGeom = new THREE.SphereGeometry( sphereRadius, numSphereSegments, numSphereSegments/2 );

	var i = 0;
	//var j = 0;
	for (var job of jobs){

		// Give material random color
		var colorMaterial = new THREE.MeshLambertMaterial({
			color: new THREE.Color(Math.random(), Math.random(), Math.random())
		});

		// Get the number of nodes for a job
		var requestedSlots = job["RequestedSlots"];
		var nodes = requestedSlots / 16;
		var sphereList = [];

		for (var j = 0; j < nodes; ++j){

			var sphere = new THREE.Mesh( sphGeom, colorMaterial );

			// Get sphere position
			top.set( radius * Math.cos( i * 2*Math.PI / radialSegments ),
				height * (i/(arc*radialSegments)) - height/2,
				sine_sign * radius * Math.sin( i * 2*Math.PI / radialSegments ) );

			// Set sphere position
			sphere.position.copy( top );

			// Add sphere to sphereList
			sphereList.push(sphere);

			helix.add( sphere );

			// if (i == 0) {

			// 	// Create wireframe that hugs original sphere
			// 	var wireMat = new THREE.MeshBasicMaterial({ wireframe: true });
			// 	var wireframe = new THREE.Mesh( sphGeom, wireMat ); 
			// 	wireframe.position.copy(top);
			// 	wireframe.scale.set(1.01, 1.01, 1.01);
			// 	helix.add(wireframe);
			
			// }

			++i;

		}
		
		// Add sphereList to job
		job["sphereList"] = sphereList;

	}

	return helix;
}

// Populate jobs lists
function filterJobs(jobsDict) {

	var smallJobs  = [];
	var mediumJobs = [];
	var largeJobs  = [];
	var allJobs    = [];

	// Get jobs object for every project
	for (var key in projects) {

		// Get jobs list for each project
		var jobs = projects[key]["jobs"];

		// Do add requestedSlots/16 nodes to helix with unique color for every project
		for (var job of jobs){

			// Get the number of nodes for a job
			var requestedSlots = job["RequestedSlots"];

			// Add to appropriate jobs list in no particular order
			if (requestedSlots < smallJobsUpperBound) {
				
				// Add to small jobs
				smallJobs.push(job);

			} else if (requestedSlots < mediumJobsUpperBound) {

				// Add to medium jobs
				mediumJobs.push(job);

			} else if (requestedSlots < largeJobsUpperBound) {

				// Add to large jobs
				largeJobs.push(job);

			// DELETE ABOVE CASE WHEN UNCOMMENTING THESE LINES
			// TO UNRESTRICT LARGE JOBS SIZE LIMIT
			// } else {

			// 	// Add to large jobs
			// 	largeJobs.push(job);

			}

			allJobs.push(job);
		}
	}

	// Same job lists into jobsDict
	jobsDict["small"]  = smallJobs;
	jobsDict["medium"] = mediumJobs;
	jobsDict["large"]  = largeJobs;
	jobsDict["all"]    = allJobs;
}

// Returns teh currently selected helix
function getSelectedHelix() {
	return helices[selectedJobType];
}

// Remove all wireframes from list
function clearWireframesList() {
	wireframes = [];
}

function removeWireframesFromHelix(helix) {
	
	for (var wireframe of wireframes) {
			
		helices[selectedJobType].remove(wireframe);

	}
	
}

// Size camera and renderer to screen
function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

// Removes old wireframes and draws new ones
function updateHighlightedSpheres(selectedSphere) {

	if (selectedSphere != undefined) {

		// Deselect old jobs
		//debugger
		removeWireframesFromHelix(helices[selectedJobType]);
		clearWireframesList();
		//debugger

		console.log("in updateHighlightedSpheres Selected sphere is :");
		console.log(selectedSphere);

		updateSelectedProject(selectedSphere, jobsDict[selectedJobType]);
		drawWireframes(selectedSphere);

	}

}

// Used when changing  visible helix
function setVisibleHelix(newType) {

	helices[selectedJobType].visible = false;

	removeWireframesFromHelix(helices[selectedJobType]);

	helices[newType].visible = true;
	
	selectedJobType = newType;

	var randomSphere = getRandomSphere(helices[selectedJobType]);

	updateHighlightedSpheres(randomSphere);

}

// Sets selectedJobType to newType
function setSelectedJobType(newType) {

	selectedJobType = newType;

}

// Called in helixOrbitControls.js and updateHighlighted spheres
// Finds the new selected project based on newly selected job
function updateSelectedProject(selectedSphere, jobs) {

	var selectedJobNum = -1;

	for (var job of jobs) {
		var job = jobs[jobNum];
			
		// See if selected sphere is in job's sphere list
		//var sphereList = job["sphereList"];
		if (job["sphereList"] != undefined) {

			if (job["sphereList"].indexOf(selectedSphere.object) != -1) {

				selectedProjectName = job["Extension"]["LocalAccount"];
				console.log("selected project name is " + selectedProjectName);

			}

		}

	}

	hud();

}

// Loop through every sphere and show
// wireframe for selectedSphere's job/project
function drawWireframes(selectedSphere) {

	// Create wireframe that hugs original sphere
	var wireMat   = new THREE.MeshBasicMaterial({ wireframe: true });
	var sphGeom   = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry( sphereRadius, numSphereSegments, numSphereSegments/2 ));
	
	// Loop through selected jobs list and highlight every sphere 
	for (var job of jobsDict[selectedJobType]) {
		
		// See if selected sphere is in job's sphere list
		if (job["sphereList"] != undefined && job["Extension"]["LocalAccount"] == selectedProjectName) {

			//console.log("highlighting spheres for project name:");
			//console.log(job["Extension"]["LocalAccount"]);
			
			for (var sphere of job["sphereList"]) {
				//debugger
				console.log("project name for job sphere is in");
				console.log(job["Extension"]["LocalAccount"]);
				// Create completely new object for wireframe
				var wireframe = new THREE.Mesh( sphGeom, wireMat ); 
				wireframe.position.copy( sphere.position );
				wireframe.scale.set(1.01, 1.01, 1.01);
				
				helices[selectedJobType].add(wireframe);
				
				// Use wireframeHelper
				// var wireframe = new THREE.WireframeHelper(sphere);
				// wireframe.material.color.set( 0xffffff );
				// wireframe.position.copy( sphere.position );
				// scene.add(wireframe);
				wireframes.push(wireframe);

			}

		}

	}

}

// Loops through helix's jobs and counts up all spheres
function getTotalNumSpheres(jobsList) {

	numSpheres = 0;

	for (var job of jobsList) {

		for (var sphere of job["sphereList"]) {

			++numSpheres;

		}

	}

	return numSpheres;

}

//Returns a random sphere object from the given helix
function getRandomSphere(helix) {

	var i = 0;
	var randomSphere;
	var totalNumSpheres = getTotalNumSpheres(jobsDict[selectedJobType]);
	var randomJobNum = Math.floor(Math.random() * totalNumSpheres);

	for (var job of jobsDict[selectedJobType]) {

		for (var sphere of job["sphereList"]) {
			
			if (randomJobNum == i) {
				
				// Create new object to be compatible with 
				// "randomSphere.object" in drawWireframes()
				randomSphere = new Object();
				randomSphere.object = sphere;

			}

			++i;

		}

	}
	console.log("in helices Selected sphere is :");
	console.log(randomSphere);

	return randomSphere;

}

// Get frame to render and render
function animate() {

	window.requestAnimationFrame(animate);

	//helices[selectedJobType].rotation.x += 0.005;
	helices[selectedJobType].rotation.y += 0.001;

	render();

}

// Update Heads Up Display
function hud(project) {
	var $hud = $("#hud");
	var $institution = $hud.find(".job-institution");
	var $fos = $hud.find(".job-fos");
	var $pi = $hud.find(".job-pi");
	var $reqTime = $hud.find(".job-requested-time");
	var $elapTime = $hud.find(".job-elapsed-time");
	var $abstract = $hud.find(".job-abstract");
	 
	$institution.text("Institution: " +  projects[selectedProjectName]["pi_institution"]);
	$fos.text("Field of Science: " + projects[selectedProjectName]["field_of_science"]);
	//$reqTime.text("Requested Time: " + projects[selectedProjectName]["field_of_science"]);
	//$elapTime.text("Elapsed Time: " + projects[selectedProjectName]["field_of_science"]);
	$pi.text("PI: " + projects[selectedProjectName]["principal_investigator"]);
	$abstract.text("Abstract: " + projects[selectedProjectName]["project_abstract"]);
}

// Render frame
function render() {
	renderer.render(scene, camera);
}

$(document).ready(function() {

	selectedJobType = "medium";
	setupScene();

	// Get project data

	// THE D3 WAY
	// d3.json("projects.json", function(error, data) {
	// 	if(error) {
	// 		throw error;
	// 	} else {
	// 		projects = data;
	// 		debugger
	// 		console.log("projects loaded");
	// 		numProjects = Object.keys(projects).length;
	// 		console.log("number of projects: " + numProjects);

	// 		fillScene();

	// 		// Find random sphere to select for initial job highlighting
	// 		var randomSphere = getRandomSphere(helices[selectedJobType]);

	// 		updateHighlightedSpheres(randomSphere);

	// 		animate();
	// 	}
	// });

	// THE JQUERY WAY
	$.getJSON( 'projects.json', function( data ) {

		projects = data;
	}).done(function(){
		console.log("projects loaded");
		numProjects = Object.keys(projects).length;
		console.log("number of projects: " + numProjects);

		fillScene();

		// Find random sphere to select for initial job highlighting
		var randomSphere = getRandomSphere(helices[selectedJobType]);

		updateHighlightedSpheres(randomSphere);
	
		animate();
	}).fail(function( error ) {
		
		// Since jQuery json requests don't print errors nicely
		d3.json("projects.json", function( error, data ) {

			if(error) throw error;

		});

	});

});	
