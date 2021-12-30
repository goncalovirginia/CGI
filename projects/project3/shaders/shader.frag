/*precision highp float;

uniform bool uUseNormals;
varying vec3 fNormal;

varying vec4 fColor;

void main()
{
    gl_FragColor = fColor;
}*/
precision mediump float;

varying vec3 fPosition;
varying vec3 fNormal;

uniform vec3 materialAmb;   //Ka
uniform vec3 materialDif;   //Kd
uniform vec3 materialSpe;
uniform float shininess;

uniform vec3 uAmbient;
uniform vec3 lightDif;
const vec3 lightSpe = vec3(1.0, 1.0, 1.0);

vec3 ambientColor = uAmbient * materialAmb;
vec3 diffuseColor = lightDif * materialDif;
vec3 specularColor = lightSpe * materialSpe;

varying vec3 fLight;
varying vec3 fViewer;

void main() {
    vec3 L = normalize(fLight);
    vec3 V = normalize(fViewer);
    vec3 N = normalize(fNormal);
    vec3 H = normalize(L+V);
    float diffuseFactor = max( dot(L,N), 0.0 );
    vec3 diffuse = diffuseFactor * diffuseColor;
    float specularFactor = pow(max(dot(N,H), 0.0), shininess);
    vec3 specular = specularFactor * specularColor;
    if( dot(L,N) < 0.0 ) {
    specular = vec3(0.0, 0.0, 0.0);
    }
    gl_FragColor = vec4(ambientColor + diffuse + specular, 1.0);
}