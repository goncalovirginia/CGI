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

function setup(shaders) {
    const canvas = document.getElementById('gl-canvas');
    const gl = setupWebGL(canvas);

    //let color;

    CUBE.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);
    PYRAMID.init(gl);
    CYLINDER.init(gl);

    const program = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);

    // Camera  
    let camera = {
        eye: vec3(0,0,5),
        at: vec3(0,0,0),
        up: vec3(0,1,0),
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

    let light = {
        position : vec3(1.0,1.0,0),
        ambient: [131,77,148],
        diffuse: [62,117,12],
        specular:[153,21,116],
        directional: false,
        active: true
    }

    let material = {
        ambience:[134,50,150],
        diffuse: [40,146,134],
        specular:[76,11,138],
        objectDrawn: "Sphere",
        shininess: 6.0
    }



    const gui = new dat.GUI();

    const optionsGui = gui.addFolder("options");
    optionsGui.add(options, "backfaceculling").name("backface culling").onChange(()=> {
        options.backfaceculling?gl.enable(gl.CULL_FACE):gl.disable(gl.CULL_FACE);
    });
    optionsGui.add(options, "depthtest").name("depth test").onChange(()=> {
        options.depthtest?gl.enable(gl.DEPTH_TEST): gl.disable(gl.DEPTH_TEST);
    });
    optionsGui.add(options, "showlights").name("show lights");


    const cameraGui = gui.addFolder("camera");

    cameraGui.add(camera, "fovy").min(1).max(100).step(1).listen();
    //cameraGui.add(camera, "aspect").min(0).max(10).listen().domElement.style.pointerEvents = "none";
    
    cameraGui.add(camera, "near").min(0.1).max(20).onChange( function(v) {
        camera.near = Math.min(camera.far-0.5, v);
    });

    cameraGui.add(camera, "far").min(0.1).max(20).listen().onChange( function(v) {
        camera.far = Math.max(camera.near+0.5, v);
    });

    const eye = cameraGui.addFolder("eye");
    eye.add(camera.eye, 0).step(0.05).name("x");//.domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 1).step(0.05).name("y");//.domElement.style.pointerEvents = "none";;
    eye.add(camera.eye, 2).step(0.05).name("z");//.domElement.style.pointerEvents = "none";;

    const at = cameraGui.addFolder("at");
    at.add(camera.at, 0).step(0.05).name("x");//.domElement.style.pointerEvents = "none";;
    at.add(camera.at, 1).step(0.05).name("y");//.domElement.style.pointerEvents = "none";;
    at.add(camera.at, 2).step(0.05).name("z");//.domElement.style.pointerEvents = "none";;

    const up = cameraGui.addFolder("up");
    up.add(camera.up, 0).step(0.05).name("x");//.domElement.style.pointerEvents = "none";;
    up.add(camera.up, 1).step(0.05).name("y");//.domElement.style.pointerEvents = "none";;
    up.add(camera.up, 2).step(0.05).name("z");//.domElement.style.pointerEvents = "none";;

    const lightGui = gui.addFolder("light");

    const position = lightGui.addFolder("position");
    position.add(light.position, 0).step(0.05).name("x");
    position.add(light.position, 1).step(0.05).name("y");
    position.add(light.position, 2).step(0.05).name("z");
    

    lightGui.addColor(light, "ambient").onChange((val) =>{
        light.ambient=val;
    });
    lightGui.addColor(light,"diffuse").onChange((val)=>{
        light.diffuse=val;
    });
    lightGui.addColor(light,"specular").onChange((val)=>{
        light.specular=val;
    });

    lightGui.add(light, "directional");
    lightGui.add(light, "active");

    const gui2 = new dat.GUI();
    const materialGui = gui2.addFolder("material");
    materialGui.add(material,"objectDrawn", ["Cube","Sphere", "Cylinder", "Torus", "Pyramid"]).onChange(function(value){
        material.objectDrawn = value;
    });
    materialGui.addColor(material, "ambience").onChange((val)=>{
        material.ambience=val;
    });
    
    materialGui.addColor(material, "diffuse").onChange((val)=>{
        material.diffuse=val;
    });
    materialGui.addColor(material, "specular").onChange((val)=>{
        material.specular=val;
    });
    materialGui.add(material, "shininess").min(0.1).max(30.0).onChange((val)=>{
        material.shininess=val;
    });
    
    

    // matrices
    let mView, mProjection;

    var lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
    //color = gl.getUniformLocation(program, "color");

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

    

    function resizeCanvasToFullWindow()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function render(time)
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        mView = lookAt(camera.eye, camera.at, camera.up);
        STACK.loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(STACK.modelView()));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(STACK.modelView())));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mView"),false, flatten(lookAt(camera.eye, camera.at, camera.up)));

        gl.uniform1i(gl.getUniformLocation(program, "uUseNormals"), options.normals);
        gl.uniform3fv(gl.getUniformLocation(program, "uAmbient"),vec3((light.ambient[0])/255,(light.ambient[1])/255,(light.ambient[2])/255));
        gl.uniform3fv(gl.getUniformLocation(program, "lightDif"),vec3((light.diffuse[0])/255,(light.diffuse[1]/255),(light.diffuse[2])/255));
        gl.uniform3fv(gl.getUniformLocation(program, "lightSpe"),vec3((light.specular[0]/255),(light.specular[1]/255),(light.specular[2])/255));

        gl.uniform3fv(gl.getUniformLocation(program, "materialAmb"),vec3((material.ambience[0])/255,(material.ambience[1])/255,(material.ambience[2])/255));
        gl.uniform3fv(gl.getUniformLocation(program, "materialDif"),vec3((material.diffuse[0])/255,(material.diffuse[1]/255),(material.diffuse[2])/255));
        gl.uniform3fv(gl.getUniformLocation(program, "materialSpe"),vec3((material.specular[0]/255),(material.specular[1]/255),(material.specular[2])/255));
        gl.uniform1f(gl.getUniformLocation(program,"shininess"),material.shininess);

          //////////////////
        pushMatrix();   
        multTranslation([0,-.7,0]);
        multScale([3,0.1,3]);
        uploadModelView();
        //gl.uniform3fv(color, vec3(0.1, 0.1, 0.1));
        CUBE.draw(gl, program, gl.TRIANGLES);
        popMatrix();
          /////////////////
        
          //OBJECTO ELEMENTAR  - NESTE CASO UMA ESFERA
        pushMatrix();
        uploadModelView();
        //gl.uniform3fv(color, vec3(0.5, 0.5, 0.5));
        switch(material.objectDrawn){
            case "Sphere":
                SPHERE.draw(gl, program, gl.TRIANGLES);
                break;
            case "Cube":
                CUBE.draw(gl, program, gl.TRIANGLES);
                break;
            case "Torus":
                TORUS.draw(gl, program, gl.TRIANGLES);
                break;
            case "Cylinder":
                CYLINDER.draw(gl, program, gl.TRIANGLES);
                break;
            case "Pyramid":
                PYRAMID.draw(gl, program, gl.TRIANGLES);
                break;
            default:
                break;
        }
        popMatrix();

        //LUZ - NAO SEI COMO LIGAR ISTO A OPCAO SHOW LIGHTS DENTRO DO INTERFACE
        pushMatrix();
        multTranslation(light.position);
        multScale([0.1,0.1,0.1]);
        uploadModelView();
        //gl.uniform3fv(color, vec3(1.0, 1.0, 1.0));
        SPHERE.draw(gl, program, gl.LINES);
        popMatrix();
        gl.uniform3fv(lightWorldPositionLocation, vec3(light.position));
        //gl.uniform3fv(color, vec3(1.0, 1.0, 1.0));
        
        
    }
}

const urls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(urls).then( shaders => setup(shaders));