const vec4 lightPosition = vec4(0.0, 1.8, 1.3, 1.0);

const vec3 materialAmb = vec3(1.0, 0.0, 0.0);
const vec3 materialDif = vec3(1.0, 0.0, 0.0);
const vec3 materialSpe = vec3(1.0, 1.0, 1.0);
const float shininess = 6.0;

const vec3 lightAmb = vec3(0.2, 0.2, 0.2);
const vec3 lightDif = vec3(0.7, 0.7, 0.7);
const vec3 lightSpe = vec3(1.0, 1.0, 1.0);

vec3 ambientColor = lightAmb * materialAmb;
vec3 diffuseColor = lightDif * materialDif;
vec3 specularColor = lightSpe * materialSpe;

uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mView;
uniform mat4 mViewNormals;
uniform mat4 mNormals;

varying vec3 fNormal;

varying vec4 fColor;

attribute vec4 vPosition;
attribute vec4 vNormal;


void main()
{
    vec3 L=vec3(1.0,1.0,1.0); // Normalized vector pointing to light at vertex

    //////////////TIRADO DOS SLIDES////////
    vec3 posC = (mModelView * vPosition).xyz;


    if(lightPosition.w == 0.0){
        L = normalize((mViewNormals*lightPosition).xyz);
    }
        
    else{ 
        L = normalize((mView*lightPosition).xyz - posC);
    }

    vec3 V = vec3(0,0,1);
    vec3 H = normalize(L+V);
    vec3 N = normalize( (mNormals * vNormal).xyz);


    //vec3 R = reflect(-L,N);
    float diffuseFactor = max( dot(L,N), 0.0 );
    vec3 diffuse = diffuseFactor * diffuseColor;

    float specularFactor = pow(max(dot(N,H), 0.0), shininess);
    vec3 specular = specularFactor * specularColor;

    if( dot(L,N) < 0.0 ) {
        specular = vec3(0.0, 0.0, 0.0);
    }
    gl_Position = mProjection * mModelView * vPosition;
    fColor = vec4(ambientColor + diffuse + specular, 1.0);
}