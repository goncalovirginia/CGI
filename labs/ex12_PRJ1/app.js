import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js';

/** @type {WebGLRenderingContext} */
const canvas = document.getElementById("gl-canvas");
let program;
let gl;

const tableWidth = 3.0;
let tableHeight;

let points = [];
const gridSpacing = 0.05;

function resizeCanvas() {
	canvas.width = window.innerWidth;
  	canvas.height = window.innerHeight;
	tableHeight = (tableWidth * canvas.height) / canvas.width;
}

function setup(shaders) {
	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);

    gl = UTILS.setupWebGL(canvas);

    program = UTILS.buildProgramFromSources(gl, shaders["shader1.vert"], shaders["shader1.frag"]);

	for (let x = - tableWidth / 2; x <= tableWidth/2; x += gridSpacing) {
    	for (let y = - tableHeight / 2; y <= tableHeight/2; y += gridSpacing) {
        	points.push(MV.vec2(x, y));
    	}
	}

	const buffer = gl.createBuffer();
  	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  	gl.bufferData(gl.ARRAY_BUFFER, MV.flatten(points), gl.STATIC_DRAW);

  	const vPosition = gl.getAttribLocation(program, "vPosition");
  	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(vPosition);

	gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    window.requestAnimationFrame(animate);
}

function animate(time) {
	window.requestAnimationFrame(animate);

	gl.useProgram(program);

	gl.uniform1f(gl.getUniformLocation(program, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(program, "tableHeight"), tableHeight);

    gl.clear(gl.COLOR_BUFFER_BIT);

  	gl.drawArrays(gl.POINTS, 0, points.length * 2);
}

UTILS.loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(s => setup(s));
