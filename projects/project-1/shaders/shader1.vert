precision highp float;

attribute vec4 vPosition;

uniform float tableWidth;
uniform float tableHeight;

const int MAX_CHARGES = 100;
uniform vec2 chargePositions[MAX_CHARGES];
uniform float chargeValues[MAX_CHARGES];

#define TWOPI 6.28318530718

void main() {
    gl_Position = vPosition / vec4(tableWidth/2.0, tableHeight/2.0, 1.0, 1.0);
    gl_PointSize = 1.0;
}