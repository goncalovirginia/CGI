
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

uniform mat4 mProjection;
uniform mat4 mModelView;
uniform mat4 mView;
uniform mat4 mViewNormals;
uniform mat4 mNormals;

varying vec3 fNormal;

varying vec4 fColor;

attribute vec4 vPosition;
attribute vec4 vNormal;

//uniform vec3 color;
uniform vec3 u_lightWorldPosition;


void main()
{
    
    vec3 L; // Normalized vector pointing to light at vertex

    vec4 lightPosition = vec4(u_lightWorldPosition, 1.0);
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
    
    //vec3 c = fNormal + vec3(1.0, 1.0, 1.0);
    fColor = vec4(ambientColor + diffuse + specular, 1.0);
}