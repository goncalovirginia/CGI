precision highp float;

attribute vec4 vPosition;
attribute float chargeValue;

uniform float tableWidth;
uniform float tableHeight;

uniform float theta;

void main() {
    float s = sin(theta);
    float c = cos(theta);

    float x = -s * vPosition.y + c * vPosition.x;
    float y = s * vPosition.x + c * vPosition.y;

    gl_Position = vec4(x, y, 0, 1.0) / vec4(tableWidth/2.0, tableHeight/2.0, 1.0, 1.0);
    gl_PointSize = 4.0;
}