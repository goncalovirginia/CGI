import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec3 } from "../../libs/MV.js";
import { modelView, loadMatrix, multMatrix, multRotationY, multScale, pushMatrix, popMatrix, multTranslation, multRotationZ } from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';

/** @type WebGLRenderingContext */
let gl;
let mProjection;
let canvas;
let program;
let aspect;
let drawingMode; // gl.TRIANGLES or gl.LINES
let eye;
let color;

let floorTiles = [];
let floorTileColors = [];

let tankX = 0;
let tankZ = 0;
let tankAngle = 0;
let turretAngle = 0;
let gunAngle = 0;

let projectileCoordinates = [];
let projectileVectors = [];

const TANK_SPEED = 0.1;

const HULL_LENGTH = 8.0;
const HULL_WIDTH = 4.0;
const HULL_HEIGHT = 3.0;

const TURRET_LENGTH = 4.0;
const TURRET_WIDTH = 3.0;
const TURRET_HEIGHT = 2.0;

const GUN_LENGTH = 5.0;
const GUN_DIAMETER = 0.5;

const PROJECTILE_DIAMETER = GUN_DIAMETER * 0.9;

const VP_DISTANCE = 20;

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders));

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    drawingMode = gl.TRIANGLES; 

	eye = vec3(VP_DISTANCE, VP_DISTANCE, VP_DISTANCE);

    resize_canvas();

	color = gl.getUniformLocation(program, "color");

    document.onkeydown = function(event) {
		let radians;
        switch (event.key) {
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
				radians = -tankAngle * Math.PI/180;
				tankX += TANK_SPEED * Math.cos(radians);
				tankZ += TANK_SPEED * Math.sin(radians);
				break;
			case 'ArrowDown':
				radians = -tankAngle * Math.PI/180;
				tankX -= TANK_SPEED * Math.cos(radians);
				tankZ -= TANK_SPEED * Math.sin(radians);
				break;
			case 'ArrowLeft':
				tankAngle++;
				break;
			case 'ArrowRight':
				tankAngle--;
				break;
			case '1':
				eye = vec3(VP_DISTANCE, 0, 0);
				break;
			case '2':
				eye = vec3(0, VP_DISTANCE, 0);
				break;
			case '3':
				eye = vec3(0, 0, VP_DISTANCE);
				break;
			case '4':
				axonometricView = !axonometricView;
				break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    SPHERE.init(gl);
	CUBE.init(gl);
	CYLINDER.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

	generateFloor();
    
    window.requestAnimationFrame(render);
}

function render() {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

   	loadMatrix(lookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0)));

	for (let i = 0; i < projectileCoordinates.length; i++) {
		projectileCoordinates[i][0] += 1;
	}

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
    mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
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
	multTranslation(vec3(tankX, HULL_HEIGHT/2, tankZ));
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
}

function Hull() {
    multScale(vec3(HULL_LENGTH, HULL_HEIGHT, HULL_WIDTH));

    uploadModelView();
	gl.uniform3fv(color, vec3(0.0, 0.25, 0.0));
    CUBE.draw(gl, program, drawingMode);
}

function Turret() {
	multScale(vec3(TURRET_LENGTH, TURRET_HEIGHT, TURRET_WIDTH));

    uploadModelView();
	gl.uniform3fv(color, vec3(0.0, 0.27, 0.0));
    CUBE.draw(gl, program, drawingMode);
}

function Gun() {
	multTranslation(vec3(TURRET_LENGTH, 0, 0));
	multRotationZ(90);
	multRotationZ(gunAngle);
	multScale(vec3(GUN_DIAMETER, GUN_LENGTH, GUN_DIAMETER));

    uploadModelView();
	gl.uniform3fv(color, vec3(0.0, 0.29, 0.0));
	CYLINDER.draw(gl, program, drawingMode);
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
