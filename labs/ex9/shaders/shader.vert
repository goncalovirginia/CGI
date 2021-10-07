attribute vec4 vPosition;
attribute vec4 vColor;

varying vc4 fColor;

void main() {
	gl_Position = vPosition;
	fColor = vColor;
}