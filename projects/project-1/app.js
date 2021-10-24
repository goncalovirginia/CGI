import * as UTILS from '../../libs/utils.js';
import * as MV from '../../libs/MV.js';

/** @type {WebGLRenderingContext} */
const canvas = document.getElementById("gl-canvas");
let gl;
let gridProgram;
let chargesProgram;

let gBuffer;
let cBuffer;

const tableWidth = 3.0;
let tableHeight;

let grid = [];
const GRID_SPACING = 0.05;

let charges = [];
let chargeValues = [];
const MAX_CHARGES = 100;

const ANGULAR_VELOCITY = 0.01;

const NOISE_DISTANCE = GRID_SPACING / 5;

let drawCharges = true;

let vPositionBuffSize;
let vTypeBuffSize;
const cPositionBuffSize = MAX_CHARGES * MV.sizeof['vec2'];
const cTypeBuffSize = cPositionBuffSize / 2;

UTILS.loadShadersFromURLS(["shader1.vert", "shader2.vert", "shader1.frag", "shader2.frag"]).then(s => setup(s));

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
		shaders["shader2.frag"]
	);
	
	generateGrid();

	gBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vPositionBuffSize + vTypeBuffSize, gl.STATIC_DRAW);

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(grid));

	for (let i = 0; i < grid.length/2; i++) {
		gl.bufferSubData(gl.ARRAY_BUFFER, vPositionBuffSize + i * MV.sizeof['vec2'], MV.flatten(MV.vec2(0.0, 1.0)));
	}

	cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, cPositionBuffSize + cTypeBuffSize, gl.STATIC_DRAW);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.useProgram(gridProgram);

	gl.uniform1f(gl.getUniformLocation(gridProgram, "MAX_VECTOR_LENGTH"), GRID_SPACING * 5);
	
	window.requestAnimationFrame(animate);
}

function animate(time) {
	window.requestAnimationFrame(animate);

	gl.clear(gl.COLOR_BUFFER_BIT);

	// Grid

	gl.bindBuffer(gl.ARRAY_BUFFER, gBuffer);

	setGridAttributePointers();

	gl.useProgram(gridProgram);

	updateCharges();

	gl.uniform1f(gl.getUniformLocation(gridProgram, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(gridProgram, "tableHeight"), tableHeight);

  	gl.drawArrays(gl.LINES, 0, grid.length);

	// Charges

	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

	gl.bufferSubData(gl.ARRAY_BUFFER, 0, MV.flatten(charges));
	gl.bufferSubData(gl.ARRAY_BUFFER, cPositionBuffSize, MV.flatten(chargeValues));

	setChargesAttributePointers();

	gl.useProgram(chargesProgram);

	gl.uniform1f(gl.getUniformLocation(chargesProgram, "tableWidth"), tableWidth);
	gl.uniform1f(gl.getUniformLocation(chargesProgram, "tableHeight"), tableHeight);
	
	if (drawCharges) {
		gl.drawArrays(gl.POINTS, 0, charges.length);
	}
}

function resizeCanvas() {
	canvas.width = window.innerWidth;
  	canvas.height = window.innerHeight;
	tableHeight = (tableWidth * canvas.height) / canvas.width;
	gl.viewport(0, 0, canvas.width, canvas.height);
}

function generateGrid() {
	for (let x = - tableWidth / 2; x <= tableWidth / 2; x += GRID_SPACING) {
		for (let y = - tableHeight / 2; y <= tableHeight / 2; y += GRID_SPACING) {
			let newPoint = MV.vec2(x + (Math.random() * 2 - 1) * NOISE_DISTANCE, y + (Math.random() * 2 - 1) * NOISE_DISTANCE);
			grid.push(newPoint);
			grid.push(newPoint);
		}
	}

	vPositionBuffSize = grid.length * MV.sizeof['vec2'];
	vTypeBuffSize = vPositionBuffSize / 2;
}

function setGridAttributePointers() {
	const vPosition = gl.getAttribLocation(gridProgram, "vPosition");
  	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(vPosition);

	const vType = gl.getAttribLocation(gridProgram, "vType");
  	gl.vertexAttribPointer(vType, 1, gl.FLOAT, false, 0, vPositionBuffSize);
  	gl.enableVertexAttribArray(vType);
}

function setChargesAttributePointers() {
	const cPosition = gl.getAttribLocation(chargesProgram, "cPosition");
  	gl.vertexAttribPointer(cPosition, 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(cPosition);
	
	const cType = gl.getAttribLocation(chargesProgram, "cType");
  	gl.vertexAttribPointer(cType, 1, gl.FLOAT, false, 0, cPositionBuffSize);
  	gl.enableVertexAttribArray(cType);
}

function updateCharges() {
	for (let i = 0; i < charges.length; i++) {
		let charge = charges[i];
		let chargeValue = chargeValues[i];

		let s = Math.sin(chargeValue * ANGULAR_VELOCITY);
    	let c = Math.cos(chargeValue * ANGULAR_VELOCITY);

    	let newX = -s * charge[1] + c * charge[0];
    	let newY = s * charge[0] + c * charge[1];

		charges[i] = MV.vec2(newX, newY);

    	gl.uniform2fv(gl.getUniformLocation(gridProgram, "chargePositions[" + i + "]"), MV.flatten(charges[i]));
	}
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

		if (event.ctrlKey) {
			 chargeValues[chargeValues.length - 1] = chargeValues[chargeValues.length - 1] * 2;
		}

		gl.useProgram(gridProgram);
		gl.uniform1f(gl.getUniformLocation(gridProgram, 
			"chargeValues[" + (chargeValues.length - 1) + "]"), 
			chargeValues[chargeValues.length - 1]
		);
	}
});

window.addEventListener("keydown", function (event) {
    if (event.key == " ") {
        drawCharges = !drawCharges;
    }
});