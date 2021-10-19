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

let numCharges = 0;
const MAX_CHARGES = 100;

let theta = 0;
const ANGULAR_VELOCITY = 0.5;

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
	
	for (let x = - tableWidth / 2; x <= tableWidth/2; x += GRID_SPACING) {
    	for (let y = - tableHeight / 2; y <= tableHeight/2; y += GRID_SPACING) {
        	grid.push(MV.vec2(x, y));
    	}
	}

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, (grid.length + MAX_CHARGES) * MV.sizeof['vec2'], gl.STATIC_DRAW);

  	const vPositionGrid = gl.getAttribLocation(gridProgram, "vPosition");
  	gl.vertexAttribPointer(vPositionGrid, 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(vPositionGrid);
	/*
	const vPositionCharges = gl.getAttribLocation(chargesProgram, "vPosition");
  	gl.vertexAttribPointer(vPositionCharges, 2, gl.FLOAT, false, 0, grid.length * MV.sizeof['vec2']);
  	gl.enableVertexAttribArray(vPositionCharges);
	*/
	/*
	const chargeValues = gl.getAttribLocation(chargesProgram, "chargeValue");
  	gl.vertexAttribPointer(chargeValues, 1, gl.FLOAT, false, 0, grid.length + MAX_CHARGES);
  	gl.enableVertexAttribArray(chargeValues);
	*/

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(grid));

	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	window.requestAnimationFrame(animate);
}

function animate(time) {
	window.requestAnimationFrame(animate);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(gridProgram);

	/*
	for (let i = 0; i < numCharges; i++) {
    	const uChargePosition = gl.getUniformLocation(gridProgram, "chargePositions[" + i + "]");
    	gl.uniform2fv(uChargePosition, MV.flatten(charges[i]));
	}
	*/

	gl.uniform1f(gl.getUniformLocation(gridProgram, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(gridProgram, "tableHeight"), tableHeight);
	gl.uniform4fv(gl.getUniformLocation(gridProgram, "color"), MV.vec4(1.0, 1.0, 1.0, 1.0));
  	gl.drawArrays(gl.POINTS, 0, grid.length);

	gl.useProgram(chargesProgram);

	theta += 0.05;

	gl.uniform1f(gl.getUniformLocation(chargesProgram, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(chargesProgram, "tableHeight"), tableHeight);
	gl.uniform1f(gl.getUniformLocation(chargesProgram, "theta"), theta);
	gl.uniform4fv(gl.getUniformLocation(chargesProgram, "color"), MV.vec4(1.0, 0.0, 0.0, 1.0));
	gl.drawArrays(gl.POINTS, grid.length, numCharges);
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

	if (numCharges < MAX_CHARGES) {
		gl.bufferSubData(gl.ARRAY_BUFFER, (grid.length + numCharges) * MV.sizeof['vec2'], MV.flatten(MV.vec2(xTable, yTable)));

		let chargeValue = 1.0;

		if (event.shiftKey) {
			chargeValue = -1.0;
		}

		//gl.bufferSubData(gl.ARRAY_BUFFER, (grid.length + MAX_CHARGES) * MV.sizeof['vec2'] + numCharges, chargeValue);

		//gl.uniform1f(gl.getUniformLocation(gridProgram, "chargeValues[" + numCharges + "]"), chargeValue);

		numCharges++;
	}
});