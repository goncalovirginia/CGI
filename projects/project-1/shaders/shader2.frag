precision highp float;

varying float fType;

void main() {
    vec2 fragmentPosition = 2.0 * gl_PointCoord - 1.0;
    float distance = length(fragmentPosition);
    float distanceSqrd = distance * distance;

    if (distance > 0.5) {
        discard;
    }
    if (fragmentPosition.x > -0.4 && fragmentPosition.x < 0.4 && fragmentPosition.y > -0.1 && fragmentPosition.y < 0.1) {
        discard;
    }

    if (fType > 0.0) {
        if (fragmentPosition.y > -0.4 && fragmentPosition.y < 0.4 && fragmentPosition.x > -0.1 && fragmentPosition.x < 0.1) {
            discard;
        }
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
    else {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
}