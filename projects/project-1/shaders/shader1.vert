precision highp float;

attribute vec4 vPosition;

uniform float tableWidth;
uniform float tableHeight;

const int MAX_CHARGES = 100;
uniform vec3 chargePositions[MAX_CHARGES];
uniform float chargeValues[MAX_CHARGES];

varying vec4 fColor;

#define TWOPI 6.28318530718
#define KE 8.9875517923 * pow(10.0, 9.0)
#define MAX_VECTOR_LENGTH 0.25
#define VECTOR_NORMALIZATION pow(10.0, 11.0)

vec3 calculateVector() {
    vec3 vec = vec3(0.0, 0.0, 0.0);
    vec3 gridPoint = vec3(vPosition.x, vPosition.y, 0.0);

    for (int i = 0; i < MAX_CHARGES; i++) {
        float dist = distance(chargePositions[i], gridPoint);
        float e = KE * chargeValues[i] / pow(dist, 2.0);
        vec += e * (chargePositions[i] - gridPoint) / dist;
    }

    return vec / VECTOR_NORMALIZATION;
}

/* 
Converts an angle to hue and returns the RGB values corresponding to angle mod TWOPI:
0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
*/
vec3 angle_to_hue(float angle) {
    angle /= TWOPI;
    return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec3 f) {
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.);
}

void main() {
    if (vPosition.z == 1.0) {
        vec3 vec = calculateVector();
        float len = length(vec);

        if (len > MAX_VECTOR_LENGTH) {
            vec *= MAX_VECTOR_LENGTH / len;
        }

        gl_Position = (vPosition + vec4(vec.x, vec.y, -1.0, 0.0)) / vec4(tableWidth/2.0, tableHeight/2.0, 1.0, 1.0);
        fColor = colorize(vec);
    }
    else {
        gl_Position = vPosition / vec4(tableWidth/2.0, tableHeight/2.0, 1.0, 1.0);
        fColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}