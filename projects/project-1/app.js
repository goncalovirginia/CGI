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

let charges = [];
let chargeValues = [];
const MAX_CHARGES = 100;
let pointColorUniform;

let pointColor = MV.vec4(1, 0, 0, 1);

UTILS.loadShadersFromURLS(["shader1.vert", "shader1.frag"]).then(s => setup(s));

function setup(shaders) {
	gl = UTILS.setupWebGL(canvas);

	resizeCanvas();

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
	gl.bufferData(gl.ARRAY_BUFFER, (grid.length + MAX_CHARGES) * MV.sizeof['vec2'], gl.STATIC_DRAW);

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(grid));
	
  	const vPosition = gl.getAttribLocation(program, "vPosition");
  	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(vPosition);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	window.requestAnimationFrame(animate);
}

function animate(time) {
	window.requestAnimationFrame(animate);

	gl.useProgram(program);

	gl.clear(gl.COLOR_BUFFER_BIT);

	for (let i = 0; i < charges.length; i++) {
    	const uChargePosition = gl.getUniformLocation(program, "chargePositions[" + i + "]");
    	gl.uniform2fv(uChargePosition, MV.flatten(charges[i]));
	}

	gl.uniform1f(gl.getUniformLocation(program, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(program, "tableHeight"), tableHeight);
	gl.uniform4fv(pointColorUniform, MV.vec4(1.0, 1.0, 1.0, 1.0));
  	gl.drawArrays(gl.POINTS, 0, grid.length);
	gl.uniform4fv(pointColorUniform, MV.vec4(1.0, 0.0, 0.0, 1.0));
	gl.drawArrays(gl.POINTS, grid.length, charges.length);
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
  	canvas.height = window.innerHeight;
	tableHeight = (tableWidth * canvas.height) / canvas.width;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("click", function(event) {
    const x = event.offsetX;
    const y = event.offsetY;

	const canvasCenterX = canvas.width/2;
	const canvasCenterY = canvas.height/2;

	const xTable = ((x - canvasCenterX)/canvasCenterX) * (tableWidth/2);
	const yTable = ((canvasCenterY - y)/canvasCenterY) * (tableHeight/2);
    
    console.log("Window Coordinates: (" + x + ", " + y + ")");
	console.log("Table Coordinates: (" + xTable + ", " + yTable + ")");

	if (charges.length < MAX_CHARGES) {
		charges.push(MV.vec2(xTable, yTable));
		gl.bufferSubData(gl.ARRAY_BUFFER, (grid.length + charges.length - 1) * MV.sizeof['vec2'], MV.flatten(charges[charges.length - 1]));

		event.shiftKey ? chargeValues.push(-1) : chargeValues.push(1);
		gl.uniform1f(gl.getUniformLocation(program, "chargeValues[" + (chargeValues.length-1) + "]"), chargeValues[i]);
	}
});