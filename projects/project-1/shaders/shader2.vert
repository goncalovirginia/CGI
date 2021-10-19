precision highp float;

attribute vec4 vPosition;

uniform float tableWidth;
uniform float tableHeight;

void main() {
    gl_Position = vPosition / vec4(tableWidth/2.0, tableHeight/2.0, 1.0, 1.0);
    gl_PointSize = 4.0;
}