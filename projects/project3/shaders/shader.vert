
const int MAX_LIGHTS = 8;

uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mView;
uniform mat4 mViewNormals;
uniform mat4 mNormals;

varying vec3 fNormal;
varying vec3 fLights[MAX_LIGHTS];
varying vec3 fViewer;

attribute vec4 vPosition;
attribute vec4 vNormal;

uniform vec3 u_lightWorldPosition;

void main() {
    vec4 lightPosition = vec4(u_lightWorldPosition, 1.0);
    vec3 posC = (mModelView * vPosition).xyz;

    fNormal = (mNormals * vNormal).xyz;
    fLight = normalize((mView*lightPosition).xyz - posC);
    fViewer = -posC; 

    gl_Position = mProjection * mModelView * vPosition;
}
