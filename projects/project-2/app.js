import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec3 } from "../../libs/MV.js";
import { modelView, loadMatrix, multMatrix, multRotationY, multScale, pushMatrix, popMatrix, multTranslation, multRotationZ, multRotationX } from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';
import * as PYRAMID from '../../libs/pyramid.js';

/** @type WebGLRenderingContext */
let gl;
let mProjection;
let canvas;
let program;
let aspect;
let drawingMode; // gl.TRIANGLES or gl.LINES
let eye;
let up;
let color;

let pressedKeys = [];

let floorTiles = [];
let floorTileColors = [];

let tankX = 0;
let tankZ = 0;
let tankAngle = 0;
let tankVelocity = 0;
let turretAngle = 0;
let gunAngle = 0;
let wheelAngle = 0;

let projectileCoordinates = [];
let projectileVectors = [];
let firedProjectile = false;

const ACCELERATION = 0.01;
const MAX_SPEED = 0.25;

const HULL_LENGTH = 8.0;
const HULL_WIDTH = 4.0;
const HULL_HEIGHT = 2.5;

const TURRET_LENGTH = 5.0;
const TURRET_WIDTH = 3.0;
const TURRET_HEIGHT = 2.0;

const GUN_LENGTH = 7.0;
const GUN_RADIUS = 0.5;

const NUM_WHEELS = 8;
const WHEEL_RADIUS = HULL_LENGTH/(NUM_WHEELS/2)/2;

const PROJECTILE_RADIUS = GUN_RADIUS * 0.9;
const PROJECTILE_GRAVITY = 9.8/250;

const GREENS = [vec3(0.06, 0.16, 0.06), vec3(0.08, 0.2, 0.08), vec3(0.1, 0.24, 0.1), vec3(0.1, 1.0, 0.1), vec3(0.05, 0.1, 0.05)];
const GREYS = [vec3(0.02, 0.02, 0.02), vec3(0.1, 0.1, 0.1), vec3(0.05, 0.05, 0.05)];
const REDS = [vec3(1.0, 0.1, 0.1)];

const ZOOM_INCREMENT = 0.5;

let vpDistance = 20;

class Target {

	constructor(coordinates) {
		this.coordinates = coordinates;
		this.hit = false;
	}

	checkHit(projectileCoordinates) {
		if (distance(this.coordinates, projectileCoordinates) < 1.0) {
			this.hit = true;
		}
	}

	draw() {
		pushMatrix();
			multTranslation(this.coordinates);
			multRotationX(90);
			
			uploadModelView();
			this.hit ? gl.uniform3fv(color, GREENS[3]) : gl.uniform3fv(color, REDS[0]);
			TORUS.draw(gl, program, drawingMode);
		popMatrix();
	}
}

let targets = [];

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders));

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    drawingMode = gl.TRIANGLES; 

	eye = vec3(vpDistance, vpDistance, vpDistance);

	up = vec3(0.0, 1.0, 0.0);

    resize_canvas();

	color = gl.getUniformLocation(program, "color");

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    SPHERE.init(gl);
	CUBE.init(gl);
	CYLINDER.init(gl);
	TORUS.init(gl);
	PYRAMID.init(gl);

    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

	generateFloor();

	generateTargets();
    
    window.requestAnimationFrame(render);
}

function render() {

    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

	resize_canvas();

   	loadMatrix(lookAt(eye, vec3(0, 0, 0), up));

	checkPressedKeys();

	updateTankPosition();

	updateProjectiles();

	updateWheelRotation();

	pushMatrix();
		Floor();
	popMatrix();
	pushMatrix();
		Tank();
	popMatrix();
	pushMatrix();
		Projectiles();
	popMatrix();

	for (let i = 0; i < targets.length; i++) {
		targets[i].draw();
	}
}

window.addEventListener("resize", resize_canvas);

function resize_canvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    mProjection = ortho(-vpDistance*aspect, vpDistance*aspect, -vpDistance, vpDistance, -5*vpDistance, 5*vpDistance);
}

function uploadModelView() {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
}

function generateFloor() {
	for (let i = -25; i < 25; i += 1) {
		for (let j = -25; j < 25; j += 1) {
			floorTiles.push(vec3(i, -0.5, j));
			floorTileColors.push(vec3(0.25 + Math.random() * 0.01, 0.08 + Math.random() * 0.01, 0.0));
		}
	}
}

function Floor() {
	for (let i = 0; i < floorTiles.length; i++) {
		pushMatrix();
			multTranslation(floorTiles[i]);

			uploadModelView();
			gl.uniform3fv(color, floorTileColors[i]);
			CUBE.draw(gl, program, drawingMode);
		popMatrix();
	}
}

function Tank() {
	multTranslation(vec3(tankX, WHEEL_RADIUS, tankZ));
	multRotationY(tankAngle);
	pushMatrix();
		Wheels();
	popMatrix();
	multTranslation(vec3(0.0, HULL_HEIGHT/2, 0.0));
	pushMatrix();
		Hull();
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0.0, HULL_HEIGHT/2 + TURRET_HEIGHT/2, 0));
		pushMatrix();
			multRotationY(turretAngle);
			pushMatrix();
				Turret();
			popMatrix();
			pushMatrix();
				Gun();
			popMatrix();
		popMatrix();
	popMatrix();
}

function Hull() {
	pushMatrix();
	    multScale(vec3(HULL_LENGTH, HULL_HEIGHT, HULL_WIDTH));

    	uploadModelView();
		gl.uniform3fv(color, GREENS[0]);
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	gl.uniform3fv(color, GREENS[4]);
	pushMatrix();
		multTranslation(vec3(0.0, HULL_HEIGHT/2 - 0.5, HULL_WIDTH/2 + 0.25));
		multScale(vec3(HULL_LENGTH, 1.0, 0.5));

		uploadModelView();
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(HULL_LENGTH/2, HULL_HEIGHT/2 - 0.75, HULL_WIDTH/2 + 0.25));
		multRotationZ(-45);
		multScale(vec3(1.0, 1.0, 0.5));

		uploadModelView();
		CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(HULL_LENGTH/2, HULL_HEIGHT/2 - 0.75, -HULL_WIDTH/2 - 0.25));
		multRotationZ(-45);
		multScale(vec3(1.0, 1.0, 0.5));

		uploadModelView();
		CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/2, HULL_HEIGHT/2 - 0.75, HULL_WIDTH/2 + 0.25));
		multRotationZ(45);
		multScale(vec3(1.0, 1.0, 0.5));

		uploadModelView();
		CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/2, HULL_HEIGHT/2 - 0.75, -HULL_WIDTH/2 - 0.25));
		multRotationZ(45);
		multScale(vec3(1.0, 1.0, 0.5));

		uploadModelView();
		CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0.0, HULL_HEIGHT/2 - 0.5, -HULL_WIDTH/2 - 0.25));
		multScale(vec3(HULL_LENGTH, 1.0, 0.5));

		uploadModelView();
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(HULL_LENGTH/2, 0.0, 0.0));	
		let scale = Math.sqrt(Math.pow(HULL_HEIGHT, 2.0)/2);
		multScale(vec3(scale, scale, HULL_WIDTH*0.99));
		multRotationZ(45);
		
		uploadModelView();
		gl.uniform3fv(color, GREENS[1]);
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/2 - 0.5, HULL_HEIGHT/4, HULL_WIDTH/4));	
		multScale(vec3(1.0, 1.0, 1.5));
		multRotationX(90);

		uploadModelView();
		gl.uniform3fv(color, GREYS[2]);
    	CYLINDER.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/2 - 0.5, HULL_HEIGHT/4, -HULL_WIDTH/4));	
		multScale(vec3(1.0, 1.0, 1.5));
		multRotationX(90);

		uploadModelView();
		gl.uniform3fv(color, GREYS[2]);
    	CYLINDER.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/2, -HULL_HEIGHT/4, HULL_WIDTH/4));	
		multScale(vec3(0.5, 0.5, 0.5));
		multRotationZ(90);

		uploadModelView();
		gl.uniform3fv(color, GREYS[2]);
    	TORUS.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/2, -HULL_HEIGHT/4, -HULL_WIDTH/4));	
		multScale(vec3(0.5, 0.5, 0.5));
		multRotationZ(90);

		uploadModelView();
		gl.uniform3fv(color, GREYS[2]);
    	TORUS.draw(gl, program, drawingMode);
	popMatrix();
}

function Turret() {
	pushMatrix();
		multScale(vec3(TURRET_LENGTH, TURRET_HEIGHT, TURRET_WIDTH));

    	uploadModelView();
		gl.uniform3fv(color, GREENS[1]);
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0.0, TURRET_HEIGHT/2, 0.0));
		multScale(vec3(1.25, 1.0, 1.25));

		uploadModelView();
		gl.uniform3fv(color, GREYS[2]);
    	TORUS.draw(gl, program, drawingMode);
	popMatrix();
	multTranslation(vec3(0.0, -0.1, 0.0));
	pushMatrix();
		multTranslation(vec3(-TURRET_LENGTH/2, 0.0, 0.0));
		multRotationZ(-20);
		multScale(vec3(0.75, TURRET_HEIGHT, TURRET_WIDTH));

		uploadModelView();
		gl.uniform3fv(color, GREENS[1]);
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0.0, 0.0, TURRET_WIDTH/2));
		multRotationX(-20);
		multScale(vec3(TURRET_LENGTH, TURRET_HEIGHT, 0.75));

		uploadModelView();
		gl.uniform3fv(color, GREENS[1]);
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0.0, 0.0, -TURRET_WIDTH/2));
		multRotationX(20);
		multScale(vec3(TURRET_LENGTH, TURRET_HEIGHT, 0.75));

		uploadModelView();
		gl.uniform3fv(color, GREENS[1]);
    	CUBE.draw(gl, program, drawingMode);
	popMatrix();
}

function Gun() {
	multTranslation(vec3(TURRET_LENGTH/2, 0, 0));
	multRotationZ(90);
	multRotationZ(gunAngle);
	multTranslation(vec3(0, -GUN_LENGTH/2, 0));
	pushMatrix();
		multTranslation(vec3(0, GUN_LENGTH/2 - GUN_LENGTH/8.0, 0));
		multScale(vec3(GUN_RADIUS*1.5, GUN_LENGTH/4.0, GUN_RADIUS*1.5));

		uploadModelView();
		gl.uniform3fv(color, GREENS[4]);
		CYLINDER.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0, GUN_LENGTH/2, 0));

		uploadModelView();
		gl.uniform3fv(color, GREYS[2]);
		SPHERE.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multScale(vec3(GUN_RADIUS, GUN_LENGTH, GUN_RADIUS));

    	uploadModelView();
		gl.uniform3fv(color, GREENS[2]);
		CYLINDER.draw(gl, program, drawingMode);
	popMatrix();
	pushMatrix();
		multTranslation(vec3(0.0, -GUN_LENGTH/2.0, 0.0));
		multScale(vec3(GUN_RADIUS, 1.0, GUN_RADIUS));

		uploadModelView();
		gl.uniform3fv(color, GREENS[4]);
		TORUS.draw(gl, program, drawingMode);
	popMatrix();
}

function Wheels() {
	for (let i = 1; i <= NUM_WHEELS/2; i++) {
		pushMatrix();
			WheelPair(-HULL_LENGTH/2 - WHEEL_RADIUS + WHEEL_RADIUS * 2 * i);
		popMatrix();
	}
}

function WheelPair(x) {
	multTranslation(vec3(x, 0.0, 0.0));
	pushMatrix();
		pushMatrix();
			Wheel(HULL_WIDTH/2 + WHEEL_RADIUS/3)
		popMatrix();
		pushMatrix();
			Wheel(-HULL_WIDTH/2 - WHEEL_RADIUS/3);
		popMatrix();
	popMatrix();
	pushMatrix();
		multRotationX(90);
		multRotationY(wheelAngle);
		multScale(vec3(0.5, HULL_WIDTH, 0.5));
		
		uploadModelView();
		gl.uniform3fv(color, GREYS[1]);
		CYLINDER.draw(gl, program, drawingMode);
	popMatrix();
}

function Wheel(z) {
	multTranslation(vec3(0.0, 0.0, z));
	multRotationY(90);
	multRotationX(wheelAngle);
	multRotationZ(90);
	pushMatrix();
		multScale(vec3(WHEEL_RADIUS*1.5, WHEEL_RADIUS*1.5, WHEEL_RADIUS*1.5));
		
		uploadModelView();
		gl.uniform3fv(color, GREYS[0]);
		TORUS.draw(gl, program, drawingMode);
	popMatrix();
	for (let angle = 0; angle <= 120; angle += 60) {
		pushMatrix();
			Rim(angle);
		popMatrix();
	}
}

function Rim(angle) {
	multRotationY(angle);
	multScale(vec3(WHEEL_RADIUS, WHEEL_RADIUS/2, WHEEL_RADIUS/4));

	uploadModelView();
	gl.uniform3fv(color, GREYS[1]);
	CUBE.draw(gl, program, drawingMode);
}

function addProjectile() {
	let coordinates = vec3(tankX, WHEEL_RADIUS + HULL_HEIGHT + TURRET_HEIGHT/2, tankZ);
	let angle = (tankAngle + turretAngle + 90) * Math.PI/180;
	let vector = vec3(Math.sin(angle), Math.sin(gunAngle * Math.PI/180), Math.cos(angle));
	let magnitude = Math.hypot(vector[0], vector[1], vector[2]);

	for (let i = 0; i < 3; i++) {
		vector[i] /= magnitude;
	}

	coordinates[0] += vector[0] * (TURRET_LENGTH/2 + GUN_LENGTH);
	coordinates[1] += vector[1] * GUN_LENGTH;
	coordinates[2] += vector[2] * (TURRET_LENGTH/2 + GUN_LENGTH);

	projectileCoordinates.push(coordinates);
	projectileVectors.push(vector);
}

function Projectiles() {
	for (let i = 0; i < projectileCoordinates.length; i++) {
		pushMatrix();
			multTranslation(projectileCoordinates[i]);
			multScale(vec3(PROJECTILE_RADIUS, PROJECTILE_RADIUS, PROJECTILE_RADIUS));

			uploadModelView();
			gl.uniform3fv(color, vec3(0.2, 0.2, 0.2));
			SPHERE.draw(gl, program, drawingMode);
		popMatrix();
	}
}

function updateTankPosition() {
	let radians = -tankAngle * Math.PI/180;
	tankX += tankVelocity * Math.cos(radians);
	tankZ += tankVelocity * Math.sin(radians);
}

function updateProjectiles() {
	for (let i = 0; i < projectileCoordinates.length; i++) {
		if (projectileCoordinates[i][1] < 0.0) {
			projectileCoordinates.splice(i, 1);
			projectileVectors.splice(i, 1);
			continue;
		} 

		for (let j = 0; j < 3; j++) {
			projectileCoordinates[i][j] += projectileVectors[i][j];
		}
		projectileVectors[i][1] -= PROJECTILE_GRAVITY;

		for (let target of targets) {
			target.checkHit(projectileCoordinates[i]);
		}
	}
}

function updateWheelRotation() {
	wheelAngle += tankVelocity/WHEEL_RADIUS * 180.0/Math.PI;
}

document.onkeydown = function(event) {
	if (!pressedKeys.includes(event.key)) {
		pressedKeys.push(event.key);
	}
}

document.onkeyup = function(event) {
	let keyIndex = pressedKeys.indexOf(event.key);
	if (keyIndex != -1) {
		let key = pressedKeys.splice(keyIndex, 1);

		if (key == ' ') {
			firedProjectile = false;
		}
	}
}

function checkPressedKeys() {
	for (let key of pressedKeys) {
		switch (key) {
			case 'w':
				if (gunAngle < 20) {
					gunAngle++;
				}
				break;
			case 'W':
				drawingMode = gl.LINES; 
				break;
			case 's':
				if (gunAngle > -10) {
					gunAngle--;
				}
				break;	
			case 'S':
				drawingMode = gl.TRIANGLES;
				break;
			case 'a':
				turretAngle++;
				break;	
			case 'd':
				turretAngle--;
				break;
			case 'ArrowUp':
				tankVelocity + ACCELERATION > MAX_SPEED ? tankVelocity = MAX_SPEED : tankVelocity += ACCELERATION;
				break;
			case 'ArrowDown':
				tankVelocity - ACCELERATION < -MAX_SPEED ? tankVelocity = -MAX_SPEED : tankVelocity -= ACCELERATION;
				break;
			case 'ArrowLeft':
				tankVelocity >= 0.0 ? tankAngle++ : tankAngle--;
				break;
			case 'ArrowRight':
				tankVelocity >= 0.0 ? tankAngle-- : tankAngle++;
				break;
			case ' ' :
				if (!firedProjectile) {
					addProjectile();
					firedProjectile = true;
				}
				break;
			case '1':
				eye = vec3(vpDistance, 0.0, 0.0);
				up = vec3(0.0, 1.0, 0.0);
				break;
			case '2':
				eye = vec3(0.0, vpDistance, 0.0);
				up = vec3(0.0, 0.0, 1.0);
				break;
			case '3':
				eye = vec3(0.0, 0.0, vpDistance);
				up = vec3(0.0, 1.0, 0.0)
				break;
			case '4':
				eye = vec3(vpDistance, vpDistance, vpDistance);
				up = vec3(0.0, 1.0, 0.0)
				break;
			case '+':
				if (vpDistance > 10.0) {
					vpDistance -= ZOOM_INCREMENT;
				}
				break;
			case '-':
				if (vpDistance < 25.0) {
					vpDistance += ZOOM_INCREMENT;
				}
				break;
		}
	}

	if (tankVelocity != 0.0 && !pressedKeys.includes('ArrowUp') && !pressedKeys.includes('ArrowDown')) {
		if (tankVelocity > 0.0) {
			tankVelocity - ACCELERATION < 0.0 ? tankVelocity = 0.0 : tankVelocity -= ACCELERATION;
		}
		else if (tankVelocity < 0.0 ) {
			tankVelocity + ACCELERATION > 0.0 ? tankVelocity = 0.0 : tankVelocity += ACCELERATION;
		}
	}	
}

function distance(point1, point2) {
	return Math.hypot(Math.abs(point1[0] - point2[0]), Math.abs(point1[1] - point2[1]), Math.abs(point1[2] - point2[2]));
}

function generateTargets() {
	for (let i = 0; i < 5; i++) {
		targets.push(new Target(vec3(-10.0 + 4.0 * i, 2.0, -30.0)));
	}
}