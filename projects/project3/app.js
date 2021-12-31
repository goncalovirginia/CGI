import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from '../../libs/utils.js';
import { length, flatten, inverse, mult, normalMatrix, perspective, lookAt, vec4, vec3, vec2, subtract, add, scale, rotate, normalize } from '../../libs/MV.js';
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as dat from '../../libs/dat.gui.module.js';

import * as CUBE from '../../libs/cube.js';
import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';
import * as PYRAMID from '../../libs/pyramid.js';

import * as STACK from '../../libs/stack.js';

class Light {

    constructor() {
        this.position = vec3(1, 2, -1);
        this.ambient = vec3(0, 0, 0);
        this.diffuse = vec3(100, 0, 0);
        this.specular = vec3(255, 0, 0);
        this.directional = false;
        this.active = true;
    }

}

const urls = ['shader.vert', 'shader.frag', 'shader2.frag'];

loadShadersFromURLS(urls).then( shaders => setup(shaders));

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    const MAX_LIGHTS = 8;

	let selectedLight = {
		number: 0
	}

    CUBE.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);
    PYRAMID.init(gl);
    CYLINDER.init(gl);

    const illuminationProgram = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);
	const lightProgram = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader2.frag']);
    
	// Camera  
    let camera = {
        eye: vec3(0, 3, 4),
        at: vec3(0, 0, 0),
        up: vec3(0, 1, 0),
        fovy: 45,
        aspect: 1, // Updated further down
        near: 0.1,
        far: 20
    }

    let options = {
        backfaceculling: false,
        depthtest: false,
        showlights: false,
        normals: true
    }

    let lights = [];

    lights.push(new Light());

    let material = {
        ambient: vec3(255, 255, 255),
        diffuse: vec3(255, 255, 255),
        specular: vec3(255, 255, 255),
        objectDrawn: "Torus",
        shininess: 20.0
    }

    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");

    optionsGui.add(options, "backfaceculling").name("backface culling").onChange((val)=> {
        options.backfaceculling =val;
    });

    optionsGui.add(options, "depthtest").name("depth test").onChange((val)=> {
        options.depthtest = val;
    });

    optionsGui.add(options, "showlights").name("show lights").onChange((val) => {
        options.showlights = val;
    });

    const cameraGui = gui.addFolder("camera");

    cameraGui.add(camera, "fovy").min(1).max(100).step(1).listen();
    
    cameraGui.add(camera, "near").min(0.1).max(20).onChange( function(v) {
        camera.near = Math.min(camera.far-0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).listen().onChange( function(v) {
        camera.far = Math.max(camera.near+0.5, v);
    });

    const eye = cameraGui.addFolder("eye");

    eye.add(camera.eye, 0).step(0.05).name("x");
    eye.add(camera.eye, 1).step(0.05).name("y");
    eye.add(camera.eye, 2).step(0.05).name("z");

    const at = cameraGui.addFolder("at");

    at.add(camera.at, 0).step(0.05).name("x");
    at.add(camera.at, 1).step(0.05).name("y");
    at.add(camera.at, 2).step(0.05).name("z");

    const up = cameraGui.addFolder("up");

    up.add(camera.up, 0).step(0.05).name("x");
    up.add(camera.up, 1).step(0.05).name("y");
    up.add(camera.up, 2).step(0.05).name("z");

    const lightGui = gui.addFolder("light");

	let lightNumbers = [0];

	let addLight = { 
		add: function() {
			if (lights.length == MAX_LIGHTS) {
				return;
			}

			lights.push(new Light());
			lightNumbers.push(lightNumbers.length);
			lightNumbersGui = lightNumbersGui.options(lightNumbers);
		}
	};

	lightGui.add(addLight, "add");

	let lightNumbersGui = lightGui.add(selectedLight, "number", lightNumbers).onChange(function(value) {
        selectedLight = value;

		for (var i in gui.__controllers) {
			gui.__controllers[i].updateDisplay();
		}
    });

    const position = lightGui.addFolder("position");

    position.add(lights[selectedLight.number].position, 0).step(0.05).name("x");
    position.add(lights[selectedLight.number].position, 1).step(0.05).name("y");
    position.add(lights[selectedLight.number].position, 2).step(0.05).name("z");
    
    lightGui.addColor(lights[selectedLight.number], "ambient").onChange((val) => {
        lights[selectedLight.number].ambient = val;
    });

    lightGui.addColor(lights[selectedLight.number], "diffuse").onChange((val) => {
        lights[selectedLight.number].diffuse= val;
    });

    lightGui.addColor(lights[selectedLight.number], "specular").onChange((val) => {
        lights[selectedLight.number].specular = val;
    });

    lightGui.add(lights[selectedLight.number], "directional").onChange((val) => {
        lights[selectedLight.number].directional = val;
    });

    lightGui.add(lights[selectedLight.number], "active").onChange((val) => {
        lights[selectedLight.number].active = val;
    });

    const gui2 = new dat.GUI();

    const materialGui = gui2.addFolder("material");

    materialGui.add(material, "objectDrawn", ["Cube", "Sphere", "Cylinder", "Torus", "Pyramid"]).onChange(function(value){
        material.objectDrawn = value;
    });

    materialGui.addColor(material, "ambient").onChange((val)=>{
        material.ambient=val;
    });
    
    materialGui.addColor(material, "diffuse").onChange((val)=>{
        material.diffuse = val;
    });

    materialGui.addColor(material, "specular").onChange((val)=>{
        material.specular=val;
    });

    materialGui.add(material, "shininess").min(0.1).max(30.0).onChange((val)=>{
        material.shininess=val;
    });

    // matrices
    let mView, mProjection;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //options.depthtest?gl.enable(gl.DEPTH_TEST): gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    resizeCanvasToFullWindow();

    window.addEventListener('resize', resizeCanvasToFullWindow);

    window.addEventListener('wheel', function(event) {
        const factor = 1 - event.deltaY/1000;
        camera.fovy = Math.max(1, Math.min(100, camera.fovy * factor)); 
    });

    window.requestAnimationFrame(render);

    function resizeCanvasToFullWindow() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.aspect = canvas.width / canvas.height;
        gl.viewport(0,0,canvas.width, canvas.height);
    }

    function uploadModelView(program) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function render(time) {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(illuminationProgram);

        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        gl.uniformMatrix4fv(gl.getUniformLocation(illuminationProgram, "mModelView"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(illuminationProgram, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(illuminationProgram, "mNormals"), false, flatten(normalMatrix(STACK.modelView())));
        gl.uniformMatrix4fv(gl.getUniformLocation(illuminationProgram, "mView"), false, flatten(lookAt(camera.eye, camera.at, camera.up)));

        gl.uniform1i(gl.getUniformLocation(illuminationProgram, "uNumLights"), lights.length);

        for (let i = 0; i < lights.length; i++) { 
			gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "u_lightWorldPosition"), lights[i].position);

            gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uLight[" + i + "].pos"), lights[i].position);
            gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uLight[" + i + "].Ia"), rgb255to1(lights[i].ambient));
            gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uLight[" + i + "].Id"), rgb255to1(lights[i].diffuse));
            gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uLight[" + i + "].Is"), rgb255to1(lights[i].specular));
            gl.uniform1f(gl.getUniformLocation(illuminationProgram, "uLight[" + i + "].isDirectional"), lights[i].directional);
            gl.uniform1f(gl.getUniformLocation(illuminationProgram, "uLight[" + i + "].isActive"), lights[i].active);
        }

        gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uMaterial.Ka"), rgb255to1(material.ambient));
        gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uMaterial.Kd"), rgb255to1(material.diffuse));
        gl.uniform3fv(gl.getUniformLocation(illuminationProgram, "uMaterial.Ks"), rgb255to1(material.specular));
        gl.uniform1f(gl.getUniformLocation(illuminationProgram,"uMaterial.shininess"), material.shininess);

        pushMatrix();   
            multTranslation([0,-.7,0]);
            multScale([3,0.1,3]);
            uploadModelView(illuminationProgram);
            CUBE.draw(gl, illuminationProgram, gl.TRIANGLES);
        popMatrix();
        pushMatrix();
        	uploadModelView(illuminationProgram);

            switch (material.objectDrawn) {
                case "Sphere":
                    SPHERE.draw(gl, illuminationProgram, gl.TRIANGLES);
                    break;
                case "Cube":
                    CUBE.draw(gl, illuminationProgram, gl.TRIANGLES);
                    break;
                case "Torus":
                    TORUS.draw(gl, illuminationProgram, gl.TRIANGLES);
                    break;
                case "Cylinder":
                    CYLINDER.draw(gl, illuminationProgram, gl.TRIANGLES);
                    break;
            	case "Pyramid":
            	    PYRAMID.draw(gl, illuminationProgram, gl.TRIANGLES);
            	    break;
            	default:
            	    console.log("Somehow an invalid shape was selected.")
            	    break;
        	}
        popMatrix();

		gl.useProgram(lightProgram);

		for (let i = 0; i < lights.length; i++) {
			gl.uniform3fv(gl.getUniformLocation(lightProgram, "u_lightWorldPosition"), lights[i].position);
			gl.uniform3fv(gl.getUniformLocation(lightProgram, "uColor"), lights[i].specular);

	        pushMatrix();
    	    	multTranslation(lights[i].position);
            	multScale(vec3(0.1, 0.1, 0.1));
            	uploadModelView(lightProgram);
        		SPHERE.draw(gl, lightProgram, gl.TRIANGLES);
        	popMatrix();
		}
    }
}

function rgb255to1(rgb) {
    return vec3(rgb[0]/255, rgb[1]/255, rgb[2]/255);
}