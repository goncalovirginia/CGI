precision highp float;

uniform bool uUseNormals;
varying vec3 fNormal;

void main()
{
    vec3 c = vec3(1.0, 1.0, 1.0);

    if( uUseNormals) 
        c = 0.5 *(fNormal + vec3(1.0, 1.0, 1.0));

    gl_FragColor = vec4(c, 1.0);
}