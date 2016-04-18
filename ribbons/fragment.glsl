precision mediump float;

uniform int u_time;

varying vec3 v_position;
varying float light;

float PI = 3.14;

// pretty colors
vec3 rainbow (float t) {
    // hsl-ish via
    // http://www.quasimondo.com/archives/000696.php#000696
    t = t * (PI / 180.0);
    float saturation = 0.8;
    float luminance = 0.5;
    float u = cos(t) * saturation;
    float v = sin(t) * saturation;
    float r =  luminance  + 1.139837398373983740  * v;
    float g = luminance  - 0.3946517043589703515  * u - 0.5805986066674976801 * v;
    float b = luminance + 2.03211091743119266 * u;
    return vec3(r,g,b);
}

void main() {
    float t = float(u_time) * 2.0;
    gl_FragColor = vec4(1.0);
    gl_FragColor.rgb *= light;
}
