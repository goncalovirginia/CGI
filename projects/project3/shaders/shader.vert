attribute vec4 vPosition;
attribute vec3 vNormal;

uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mNormals;

varying vec3 fNormal;
varying vec4 fColor;

const vec4 lightPosition = vec4(0.0, 1.8, 1.3, 1.0);
const vec3 materialAmb = vec3(1.0, 0.0, 0.0);
const vec3 materialDif = vec3(1.0, 0.0, 0.0);
const vec3 materialSpe = vec3(1.0, 1.0, 1.0);
const float shininess = 6.0;

const vec3 lightAmb = vec3(0.2, 0.2, 0.2);
const vec3 lightDif = vec3(0.7, 0.7, 0.7);
const vec3 lightSpe = vec3(1.0, 1.0, 1.0);

uniform mat4 mView; // Matriz resultante de lookAt(), p.ex.
uniform mat4 mViewNormals; // Matriz inversa da transposta de mView

void main()
{
    /*vec3 posC = (mModelView * vPosition).xyz;
    vec3 L; // Normalized vector pointing to light at vertex*/

    gl_Position = mProjection * mModelView * vPosition;
    fNormal = (mNormals * vec4(vNormal, 0.0)).xyz;

    // normal vectors are transformed to camera frame using a
    // a matrix derived from mModelView (see MV.js code)

    /*vec3 N = normalize( (mNormals * vNormal).xyz);

    if(lightPosition.w == 0.0)
        L = normalize((mViewNormals*lightPosition).xyz);
    else
        L = normalize((mView*lightPosition).xyz - posC);

    // Eye is at origin in camera frame (see lookAt())
    // thus V = -posC (for perspective projection only)
    vec3 V = normalize(-posC);*/
}