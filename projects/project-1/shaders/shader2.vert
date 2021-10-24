precision highp float;

attribute vec4 cPosition;
attribute float cType;

uniform float tableWidth;
uniform float tableHeight;

varying float fType;

void main() {
    gl_Position = cPosition / vec4(tableWidth/2.0, tableHeight/2.0, 1.0, 1.0);
    gl_PointSize = 40.0;
    fType = cType;
}