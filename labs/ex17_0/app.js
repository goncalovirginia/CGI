import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec3 } from "../../libs/MV.js";
import { modelView, loadMatrix, multMatrix, multRotationY, multScale, pushMatrix, popMatrix, multTranslation, multRotationZ } from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';

/** @type WebGLRenderingContext */
let gl;
let mProjection;
let canvas;
let program;
let aspect;

let time = 0;           // Global simulation time in days
let speed = 10;         // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

const PLANET_SCALE = 10;    // scale that will apply to each planet and satellite
const ORBIT_SCALE = 1/60;   // scale that will apply to each orbit around the sun

const SUN_DIAMETER = 1391900;
const SUN_DAY = 24.47; // At the equator. The poles are slower as the sun is gaseous

const MERCURY_DIAMETER = 4866*PLANET_SCALE;
const MERCURY_ORBIT = 57950000*ORBIT_SCALE;
const MERCURY_YEAR = 87.97;
const MERCURY_DAY = 58.646;

const VENUS_DIAMETER = 12106*PLANET_SCALE;
const VENUS_ORBIT = 108110000*ORBIT_SCALE;
const VENUS_YEAR = 224.70;
const VENUS_DAY = 243.018;

const EARTH_DIAMETER = 12742*PLANET_SCALE;
const EARTH_ORBIT = 149570000*ORBIT_SCALE;
const EARTH_YEAR = 365.26;
const EARTH_DAY = 0.99726968;

const MOON_DIAMETER = 3474*PLANET_SCALE;
const MOON_ORBIT = 363396*ORBIT_SCALE*20;
const MOON_YEAR = 28;
const MOON_DAY = 0;

const MARS_DIAMETER = 6760*PLANET_SCALE;
const MARS_ORBIT = 227840000*ORBIT_SCALE;
const MARS_YEAR = 687;
const MARS_DAY = 24.7;

const JUPITER_DIAMETER = 142984*PLANET_SCALE;
const JUPITER_ORBIT = 778140000*ORBIT_SCALE;
const JUPITER_YEAR = 4331;
const JUPITER_DAY = 9.9;

const SATURN_DIAMETER = 116438*PLANET_SCALE;
const SATURN_ORBIT = 1427000000*ORBIT_SCALE;
const SATURN_YEAR = 10747;
const SATURN_DAY = 10.7;

const URANUS_DIAMETER = 46940*PLANET_SCALE;
const URANUS_ORBIT = 2870300000*ORBIT_SCALE;
const URANUS_YEAR = 30589;
const URANUS_DAY = 17.2;

const NEPTUNE_DIAMETER = 45432*PLANET_SCALE;
const NEPTUNE_ORBIT = 4499900000*ORBIT_SCALE;
const NEPTUNE_YEAR = 59800;
const NEPTUNE_DAY = 16.1;

const PLUTO_DIAMETER = 2274*PLANET_SCALE;
const PLUTO_ORBIT = 5913000000*ORBIT_SCALE;
const PLUTO_YEAR = 90560;
const PLUTO_DAY = 153.3;

const VP_DISTANCE = URANUS_ORBIT;

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders));

function setup(shaders) {
    canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);

    program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    mode = gl.LINES; 

    resize_canvas();

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                mode = gl.LINES; 
                break;
            case 's':
                mode = gl.TRIANGLES;
                break;
            case 'p':
                animation = !animation;
                break;
            case '+':
                if(animation) speed *= 1.1;
                break;
            case '-':
                if(animation) speed /= 1.1;
                break;
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    SPHERE.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);
}

function render() {
    if (animation) {
        time += speed;
    }

    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));

   	loadMatrix(lookAt([0,VP_DISTANCE,VP_DISTANCE], [0,0,0], [0,1,0]));

	pushMatrix();
		Sun();
    popMatrix();
    pushMatrix();
	   	multRotationY(time/MERCURY_YEAR);
	   	multTranslation(vec3(MERCURY_ORBIT, 0, 0));
	   	Mercury();
    popMatrix();
    pushMatrix();
	   	multRotationY(time/VENUS_YEAR);
	   	multTranslation(vec3(VENUS_ORBIT, 0, 0));
	   	Venus();
    popMatrix();
	pushMatrix();
	   	multRotationY(time/EARTH_YEAR);
	   	multTranslation(vec3(EARTH_ORBIT, 0, 0));
		pushMatrix();
        	Earth();
        popMatrix();
        pushMatrix();
            multRotationY(time/MOON_YEAR);
            multTranslation(vec3(MOON_ORBIT, 0, 0));
            Moon();
        popMatrix();
	popMatrix();
	pushMatrix();
	   	multRotationY(time/MARS_YEAR);
	   	multTranslation(vec3(MARS_ORBIT, 0, 0));
	   	Mars();
    popMatrix();
	pushMatrix();
	   	multRotationY(time/JUPITER_YEAR);
	   	multTranslation(vec3(JUPITER_ORBIT, 0, 0));
	   	Jupiter();
    popMatrix();
	pushMatrix();
	   	multRotationY(time/SATURN_YEAR);
	   	multTranslation(vec3(SATURN_ORBIT, 0, 0));
	   	Saturn();
    popMatrix();
	pushMatrix();
	   	multRotationY(time/URANUS_YEAR);
	   	multTranslation(vec3(URANUS_ORBIT, 0, 0));
	   	Uranus();
    popMatrix();
	pushMatrix();
	   	multRotationY(time/NEPTUNE_YEAR);
	   	multTranslation(vec3(NEPTUNE_ORBIT, 0, 0));
	   	Neptune();
    popMatrix();
	pushMatrix();
	   	multRotationY(time/PLUTO_YEAR);
	   	multTranslation(vec3(PLUTO_ORBIT, 0, 0));
	   	Pluto();
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

function Sun() {
    multScale(vec3(SUN_DIAMETER, SUN_DIAMETER, SUN_DIAMETER));
    multRotationY(time/SUN_DAY);

    uploadModelView();
    SPHERE.draw(gl, program, mode);
}

function Mercury() {
    multScale(vec3(MERCURY_DIAMETER, MERCURY_DIAMETER, MERCURY_DIAMETER));
    multRotationY(time/MERCURY_DAY);

    uploadModelView();
    SPHERE.draw(gl, program, mode);
}

function Venus() {
    multScale(vec3(VENUS_DIAMETER, VENUS_DIAMETER, VENUS_DIAMETER));
    multRotationY(time/VENUS_DAY);

    uploadModelView();
    SPHERE.draw(gl, program, mode);
}

function Earth() {
	multScale(vec3(EARTH_DIAMETER, EARTH_DIAMETER, EARTH_DIAMETER));
	multRotationY(time/EARTH_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Moon() {
	multScale(vec3(MOON_DIAMETER, MOON_DIAMETER, MOON_DIAMETER));
	//multRotationY(time/MOON_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Mars() {
	multScale(vec3(MARS_DIAMETER, MARS_DIAMETER, MARS_DIAMETER));
	multRotationY(time/MARS_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Jupiter() {
	multScale(vec3(JUPITER_DIAMETER, JUPITER_DIAMETER, JUPITER_DIAMETER));
	multRotationY(time/JUPITER_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Saturn() {
	multScale(vec3(SATURN_DIAMETER, SATURN_DIAMETER, SATURN_DIAMETER));
	multRotationY(time/SATURN_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Uranus() {
	multScale(vec3(URANUS_DIAMETER, URANUS_DIAMETER, URANUS_DIAMETER));
	multRotationY(time/URANUS_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Neptune() {
	multScale(vec3(NEPTUNE_DIAMETER, NEPTUNE_DIAMETER, NEPTUNE_DIAMETER));
	multRotationY(time/NEPTUNE_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}

function Pluto() {
	multScale(vec3(PLUTO_DIAMETER, PLUTO_DIAMETER, PLUTO_DIAMETER));
	multRotationY(time/PLUTO_DAY);

	uploadModelView();
	SPHERE.draw(gl, program, mode);
}