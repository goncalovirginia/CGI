import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js';

/** @type {WebGLRenderingContext} */
const canvas = document.getElementById("gl-canvas");
let program;
let gl;

const tableWidth = 3.0;
let tableHeight;

let grid = [];
const GRID_SPACING = 0.05;

let numPoints = 0;
const MAX_POINTS = 1000;
let pointColorUniform;

UTILS.loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(s => setup(s));

function setup(shaders) {
	resizeCanvas();

    gl = UTILS.setupWebGL(canvas);

    program = UTILS.buildProgramFromSources(
		gl,
		shaders["shader1.vert"],
		shaders["shader1.frag"]
	);

	pointColorUniform = gl.getUniformLocation(program, "color");
	
	for (let x = - tableWidth / 2; x <= tableWidth/2; x += GRID_SPACING) {
    	for (let y = - tableHeight / 2; y <= tableHeight/2; y += GRID_SPACING) {
        	grid.push(MV.vec2(x, y));
    	}
	}

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, (grid.length + MAX_POINTS) * MV.sizeof['vec2'], gl.STATIC_DRAW);

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(grid));
	
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

	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.uniform1f(gl.getUniformLocation(program, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(program, "tableHeight"), tableHeight);
	gl.uniform4fv(pointColorUniform, MV.vec4(1.0, 1.0, 1.0, 1.0));
  	gl.drawArrays(gl.POINTS, 0, grid.length);
	gl.uniform4fv(pointColorUniform, MV.vec4(1.0, 0.0, 0.0, 1.0));
	gl.drawArrays(gl.POINTS, grid.length, numPoints);
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
  	canvas.height = window.innerHeight;
	tableHeight = (tableWidth * canvas.height) / canvas.width;
}

window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("click", function(event) {
    const x = event.offsetX;
    const y = event.offsetY; 

	const canvasCenterX = canvas.width/2;
	const canvasCenterY = canvas.height/2;

	const xTable = ((x - canvasCenterX)/canvasCenterX) * (tableWidth/2);
	const yTable = ((canvasCenterY - y)/canvasCenterY) * (tableHeight/2);
    
    console.log("Click at: (" + x + ", " + y + ")");
	console.log("Table: (" + xTable + ", " + yTable + ")");

	gl.bufferSubData(gl.ARRAY_BUFFER, (grid.length + numPoints) * MV.sizeof['vec2'], MV.flatten(MV.vec2(xTable, yTable)));
	numPoints++;
});