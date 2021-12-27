precision highp float;

uniform bool uUseNormals;
varying vec3 fNormal;

varying vec4 fColor;

void main()
{
    gl_FragColor = fColor;
}