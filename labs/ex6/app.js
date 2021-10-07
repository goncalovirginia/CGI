import {
  loadShadersFromURLS,
  loadShadersFromScripts,
  setupWebGL,
  buildProgramFromSources,
} from "../../libs/utils.js";
import { vec2, flatten } from "../../libs/MV.js";

/** @type {WebGLRenderingContext} */
var gl;
var program;
var numTriangles = 10000;
var size = 0.01;

function setup(shaders) {
  // Setup
  const canvas = document.getElementById("gl-canvas");
  gl = setupWebGL(canvas);

  program = buildProgramFromSources(
    gl,
    shaders["shader.vert"],
    shaders["shader.frag"]
  );

  let vertices = [];

  for (let i = 0; i < numTriangles; i++) {
    let x = (Math.random() * 2) - 1;
    let y = (Math.random() * 2) - 1;
    vertices = vertices.concat([vec2(x, y), vec2(x + size, y + size), vec2(x + size, y - size)]);
  }

  const aBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, aBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Setup the viewport
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Setup the background color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Call animate for the first time
  window.requestAnimationFrame(animate);
}

function animate() {
  window.requestAnimationFrame(animate);

  // Drawing code
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.drawArrays(gl.TRIANGLES, 0, numTriangles * 3);
}

loadShadersFromURLS(["shader.vert", "shader.frag"]).then((shaders) =>
  setup(shaders)
);
