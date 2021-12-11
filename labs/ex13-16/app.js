import { loadShadersFromURLS, setupWebGL, buildProgramFromSources } from '../../libs/utils.js';
import { mat4, vec3, flatten, lookAt, ortho, mult, translate, rotateX, rotateY, rotateZ, scalem } from '../../libs/MV.js';

import * as SPHERE from './js/sphere.js';
import * as CUBE from './js/cube.js';

/** @type {WebGLRenderingContext} */
let canvas;

let gl;
let program;

/** View and Projection matrices */
let mView;
let mProjection;

const edge = 2.0;

let instances = [];

const shaderUrls = ['shader.vert', 'shader.frag'];

loadShadersFromURLS(shaderUrls).then(shaders=>setup(shaders));

function setup(shaders) {
    canvas = document.getElementById('gl-canvas');

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = window.innerHeight;

    gl = setupWebGL(canvas);
    program = buildProgramFromSources(gl, shaders['shader.vert'], shaders['shader.frag']);

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.viewport(0,0,canvas.width, canvas.height);

    mView = lookAt(vec3(0,0,0), vec3(-1,-1,-2), vec3(0,1,0));
    setupProjection();

    SPHERE.init(gl);
    CUBE.init(gl);

    resize();

    window.requestAnimationFrame(render);
}

function render(time) {
    window.requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    const uCtm = gl.getUniformLocation(program, "uCtm");

    for (let i = 0; i < instances.length; i++) {
        gl.uniformMatrix4fv(uCtm, false, flatten(mult(mProjection, mult(mView, instances[i].mModel))));

        switch (instances[i].type) {
            case "cube":
                CUBE.draw(gl, program, gl.LINES);
                break;
            case "sphere":
                SPHERE.draw(gl, program, gl.LINES);
                break;
            default:
                console.log("Somehow an invalid shape was entered.");
                break;
        }
    }
}

function setupProjection() {
    if (canvas.width < canvas.height) {
        const yLim = edge * canvas.height / canvas.width;
        mProjection = ortho(-edge, edge, -yLim, yLim, -10, 10);
    }
    else {
        const xLim = edge * canvas.width / canvas.height;
        mProjection = ortho(-xLim, xLim, -edge, edge, -10, 10);
    }
}

function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = window.innerHeight;
    setupProjection();
    gl.viewport( 0, 0, canvas.width, canvas.height);
}

window.addEventListener("resize", resize);

document.getElementById("add_cube").addEventListener("click", function() {
    addShape("cube");
});

document.getElementById("add_sphere").addEventListener("click", function() {
    addShape("sphere");
});

document.getElementById("remove").addEventListener("click", function() {
    let list = document.getElementById("object_instances");

    if (list.selectedIndex == -1) {
        return;
    }

    instances.splice(list.selectedIndex, 1);
    list.remove(list.selectedIndex--);
});

document.getElementById("object_instances").addEventListener("change", function() {
    let shape = instances[this.selectedIndex];
    
    let transformations = document.getElementsByClassName("wrapper");
    let i = 0;

    for (let transformation of transformations) {
        let fields = transformation.getElementsByTagName("input");
        for (let field of fields) {
            field.value = shape.values[i++];
        }
    }
});

document.getElementById("transform_container").addEventListener("change", function() {
    let list = document.getElementById("object_instances");

    if (list.selectedIndex == -1) {
        return;
    } 
    
    let values = [];
    let transformations = document.getElementsByClassName("wrapper");

    for (let transformation of transformations) {
        let fields = transformation.getElementsByTagName("input");
        for (let field of fields) {
            values.push(field.value);
        }
    }

    let translateScaleMat = mult(translate(values[0], values[1], values[2]), scalem(values[3], values[4], values[5]));
    let angleMat = mult(rotateX(values[6]), mult(rotateY(values[7]), rotateZ(values[8])));

    let shape = instances[list.selectedIndex];
    shape.values = values;
    shape.mModel = mult(translateScaleMat, angleMat);
});

function addShape(type) {
    instances.push(new Shape(type));

    let shapeElem = document.createElement("option");
    shapeElem.text = type + " " + instances.length;

    document.getElementById("object_instances").add(shapeElem);
}

class Shape {

    constructor(type) {
        this.type = type;
        this.mModel = mat4();
        this.values = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0];
    }

}
