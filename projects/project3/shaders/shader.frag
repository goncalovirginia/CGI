
precision highp float;

const int MAX_LIGHTS = 8;

struct LightInfo {
    vec3 pos;
    vec3 Ia;
    vec3 Id;
    vec3 Is;
    bool isDirectional;
    bool isActive;
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform LightInfo uLight[MAX_LIGHTS]; 
uniform MaterialInfo uMaterial; 

uniform int uNumLights;

varying vec3 fLight;
varying vec3 fViewer;
varying vec3 fPosition;
varying vec3 fNormal;

void main() {
    vec3 color = vec3(0, 0, 0);

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNumLights) {
            break;
        }
        if (!uLight[i].isActive) {
            continue;
        }

        vec3 ambientColor = uLight[i].Ia * uMaterial.Ka;
        vec3 diffuseColor = uLight[i].Id * uMaterial.Kd;
        vec3 specularColor = uLight[i].Is * uMaterial.Ks;

        vec3 L = normalize(fLight);
        vec3 V = normalize(fViewer);
        vec3 N = normalize(fNormal);
        vec3 H = normalize(L + V);

        float diffuseFactor = max(dot(L, N), 0.0);
        vec3 diffuse = diffuseFactor * diffuseColor;

        float specularFactor = pow(max(dot(N, H), 0.0), uMaterial.shininess);
        vec3 specular = specularFactor * specularColor;

        if (dot(L, N) < 0.0) {
            specular = vec3(0.0, 0.0, 0.0);
        }

        color += ambientColor + diffuse + specular;
    }

    gl_FragColor = vec4(color, 1.0);
}