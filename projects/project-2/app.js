import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec3 } from "../../libs/MV.js";
import { modelView, loadMatrix, multMatrix, multRotationY, multScale, pushMatrix, popMatrix, multTranslation, multRotationZ, multRotationX } from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';

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
let axonometricView = false;

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

const ACCELERATION = 0.01;
const MAX_SPEED = 0.25;

const HULL_LENGTH = 8.0;
const HULL_WIDTH = 4.0;
const HULL_HEIGHT = 2.5;
const HULL_DISTANCE_OFF_GROUND = 0.5;

const TURRET_LENGTH = 4.0;
const TURRET_WIDTH = 3.0;
const TURRET_HEIGHT = 2.0;

const GUN_LENGTH = 5.0;
const GUN_DIAMETER = 0.5;

const NUM_WHEELS = 8;
const WHEEL_RADIUS = HULL_LENGTH/(NUM_WHEELS/2)/2;

const PROJECTILE_DIAMETER = GUN_DIAMETER * 0.9;

let vpDistance = 20;

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders));

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    drawingMode = gl.TRIANGLES; 

	up = vec3(0, 1, 0);

    resize_canvas();

	color = gl.getUniformLocation(program, "color");

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    SPHERE.init(gl);
	CUBE.init(gl);
	CYLINDER.init(gl);
	TORUS.init(gl);

    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

	generateFloor();
    
    window.requestAnimationFrame(render);
}

function render() {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

	eye = vec3(vpDistance, vpDistance, vpDistance);

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
}

window.addEventListener("resize", resize_canvas);

function resize_canvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;

    gl.viewport(0, 0, canvas.width, canvas.height);
    mProjection = ortho(-vpDistance*aspect,vpDistance*aspect, -vpDistance, vpDistance,-3*vpDistance,3*vpDistance);
}

function uploadModelView() {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
}

function generateFloor() {
	for (let i = -25; i < 25; i += 1) {
		for (let j = -25; j < 25; j += 1) {
			floorTiles.push(vec3(i, 0, j));
			floorTileColors.push(vec3(0.25 + Math.random() * 0.01, 0.08 + Math.random() * 0.01, 0.0));
		}
	}
}

function Floor() {
	for (let i = 0; i < floorTiles.length; i++) {
		gl.uniform3fv(color, floorTileColors[i]);
		pushMatrix();
			multTranslation(floorTiles[i]);
			multScale(vec3(1, 0, 1));

			uploadModelView();
			CUBE.draw(gl, program, drawingMode);
		popMatrix();
	}
}

function Tank() {
	multTranslation(vec3(tankX, HULL_HEIGHT/2 + HULL_DISTANCE_OFF_GROUND, tankZ));
	multRotationY(tankAngle);
	pushMatrix();
		Hull();
	popMatrix();
	pushMatrix();
		multTranslation(vec3(-HULL_LENGTH/10, HULL_HEIGHT/2 + TURRET_HEIGHT/2, 0));
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
	pushMatrix();
		Wheels();
	popMatrix();
}

function Hull() {
    multScale(vec3(HULL_LENGTH, HULL_HEIGHT, HULL_WIDTH));

    uploadModelView();
	gl.uniform3fv(color, vec3(0.0, 0.16, 0.0));
    CUBE.draw(gl, program, drawingMode);
}

function Turret() {
	multScale(vec3(TURRET_LENGTH, TURRET_HEIGHT, TURRET_WIDTH));

    uploadModelView();
	gl.uniform3fv(color, vec3(0.0, 0.18, 0.0));
    CUBE.draw(gl, program, drawingMode);
}

function Gun() {
	multTranslation(vec3(TURRET_LENGTH , 0, 0));
	multRotationZ(90);
	multRotationZ(gunAngle);
	multScale(vec3(GUN_DIAMETER, GUN_LENGTH, GUN_DIAMETER));

    uploadModelView();
	gl.uniform3fv(color, vec3(0.0, 0.2, 0.0));
	CYLINDER.draw(gl, program, drawingMode);
}

function Wheels() {
	WheelsSide(HULL_WIDTH/2 + WHEEL_RADIUS/3);
	WheelsSide(-HULL_WIDTH/2 - WHEEL_RADIUS/3);
}

function WheelsSide(z) {
	for (let i = 1; i <= NUM_WHEELS/2; i++) {
		let x = -HULL_LENGTH/2 - WHEEL_RADIUS + WHEEL_RADIUS * 2 * i;
		pushMatrix();
			multTranslation(vec3(x, -HULL_HEIGHT/2 - HULL_DISTANCE_OFF_GROUND + WHEEL_RADIUS, z));
			multRotationY(90);
			multRotationX(wheelAngle);
			multRotationZ(90);
			pushMatrix();
				Wheel();
			popMatrix();
			for (let angle = 0; angle <= 120; angle += 60) {
				pushMatrix();
					Rim(angle);
				popMatrix();
			}
		popMatrix();
	}
}

function Wheel() {
	multScale(vec3(WHEEL_RADIUS*1.5, WHEEL_RADIUS*1.5, WHEEL_RADIUS*1.5));

	uploadModelView();
	gl.uniform3fv(color, vec3(0.05, 0.05, 0.05));
	TORUS.draw(gl, program, drawingMode);
}

function Rim(angle) {
	multRotationY(angle);
	multScale(vec3(WHEEL_RADIUS, WHEEL_RADIUS/2, WHEEL_RADIUS/4));

	uploadModelView();
	gl.uniform3fv(color, vec3(0.1, 0.1, 0.1));
	CUBE.draw(gl, program, drawingMode);
}

function addProjectile() {
	projectileCoordinates.push(vec3(tankX, HULL_HEIGHT + TURRET_HEIGHT/2, tankZ));
	projectileVectors.push(vec3(turretAngle, 0.0, 0.0));
}

function Projectiles() {
	for (let i = 0; i < projectileCoordinates.length; i++) {
		pushMatrix();
			multTranslation(projectileCoordinates[i]);
			multScale(vec3(PROJECTILE_DIAMETER, PROJECTILE_DIAMETER, PROJECTILE_DIAMETER));

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
		projectileCoordinates[i][0] += 1;
	}
}

function updateWheelRotation() {
	wheelAngle += tankVelocity/WHEEL_RADIUS * 30;
}

document.onkeydown = function(event) {
	if (!pressedKeys.includes(event.key)) {
		pressedKeys.push(event.key);
	}
}

document.onkeyup = function(event) {
	let keyIndex = pressedKeys.indexOf(event.key);
	if (keyIndex != -1) {
		pressedKeys.splice(keyIndex, 1);
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
			case ' ':
				addProjectile();
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
			case '1':
				eye = vec3(vpDistance, 0.0, 0.0);
				up = vec3(0.0, 1.0, 0.0);
				break;
			case '2':
				eye = vec3(0.0, vpDistance, 0.0);
				up = vec3(0, 0, 1.0);
				break;
			case '3':
				eye = vec3(0.0, 0.0, vpDistance);
				up = vec3(0.0, 1.0, 0.0)
				break;
			case '4':
				axonometricView = !axonometricView;
				break;
			case '+':
				if (vpDistance > 5) {
					vpDistance--;
				}
				break;
			case '-':
				if (vpDistance < 25) {
					vpDistance++;
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
