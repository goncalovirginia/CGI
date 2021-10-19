import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js';

/** @type {WebGLRenderingContext} */
const canvas = document.getElementById("gl-canvas");
let gl;
let gridProgram;
let chargesProgram;

const tableWidth = 3.0;
let tableHeight;

let grid = [];
const GRID_SPACING = 0.05;

let charges = [];
let chargeValues = [];
const MAX_CHARGES = 100;

const ANGULAR_VELOCITY = 0.01;

UTILS.loadShadersFromURLS(["shader1.vert", "shader2.vert", "shader1.frag"]).then(s => setup(s));

function setup(shaders) {
	gl = UTILS.setupWebGL(canvas);

	resizeCanvas();

    gridProgram = UTILS.buildProgramFromSources(
		gl,
		shaders["shader1.vert"],
		shaders["shader1.frag"]
	);

	chargesProgram = UTILS.buildProgramFromSources(
		gl,
		shaders["shader2.vert"],
		shaders["shader1.frag"]
	);
	
	createGrid();

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, (grid.length + MAX_CHARGES) * MV.sizeof['vec2'], gl.STATIC_DRAW);

  	const vPosition = gl.getAttribLocation(gridProgram, "vPosition");
  	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(vPosition);

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(grid));

	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	window.requestAnimationFrame(animate);
}

function animate(time) {
	window.requestAnimationFrame(animate);
	gl.clear(gl.COLOR_BUFFER_BIT);

	updateCharges();

	gl.useProgram(gridProgram);

	gl.uniform1f(gl.getUniformLocation(gridProgram, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(gridProgram, "tableHeight"), tableHeight);
	gl.uniform4fv(gl.getUniformLocation(gridProgram, "color"), MV.vec4(1.0, 1.0, 1.0, 1.0));
  	gl.drawArrays(gl.POINTS, 0, grid.length);

	gl.useProgram(chargesProgram);

	gl.uniform1f(gl.getUniformLocation(chargesProgram, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(chargesProgram, "tableHeight"), tableHeight);
	gl.uniform4fv(gl.getUniformLocation(chargesProgram, "color"), MV.vec4(1.0, 0.0, 0.0, 1.0));
	gl.drawArrays(gl.POINTS, grid.length, charges.length);
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
  	canvas.height = window.innerHeight;
	tableHeight = (tableWidth * canvas.height) / canvas.width;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

function createGrid() {
	for (let x = - tableWidth / 2; x <= tableWidth/2; x += GRID_SPACING) {
    	for (let y = - tableHeight / 2; y <= tableHeight/2; y += GRID_SPACING) {
        	grid.push(MV.vec2(x, y));
    	}
	}
}

function updateCharges() {
	for (let i = 0; i < charges.length; i++) {
		let charge = charges[i];
		let chargeValue = chargeValues[i];

		let s = Math.sin(chargeValue * ANGULAR_VELOCITY);
    	let c = Math.cos(chargeValue * ANGULAR_VELOCITY);

    	let newX = -s * charge.y + c * charge.x;
    	let newY = s * charge.x + c * charge.y;

		//charges[i] = MV.vec2(newX, newY);

    	gl.uniform2fv(gl.getUniformLocation(gridProgram, "chargePositions[" + i + "]"), MV.flatten(charges[i]));
	}

	gl.bufferSubData(gl.ARRAY_BUFFER, grid.length * MV.sizeof['vec2'], MV.flatten(charges));
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
		event.shiftKey ? chargeValues.push(-1.0) : chargeValues.push(1.0);

		gl.uniform1f(gl.getUniformLocation(gridProgram, "chargeValues[" + (chargeValues.length - 1) + "]"), chargeValues[chargeValues.length-1]);
	}
});