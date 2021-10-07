attribute vec4 vPosition;
uniform float dx;

void main() {
	gl_Position = vPosition + vec4(dx, 0, 0, 0);
}