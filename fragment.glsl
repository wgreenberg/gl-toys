precision mediump float;
uniform int u_time;
varying vec3 a;
varying mat4 m;

float margin = 0.1;
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
    // paint borders of faces black
    bool x_margin = a.x < -1.0 + margin || a.x > 1.0 - margin;
    bool y_margin = a.y < -1.0 + margin || a.y > 1.0 - margin;
    bool z_margin = a.z < -1.0 + margin || a.z > 1.0 - margin;
    bool ns_edge = a.z == 1.0 || a.z == -1.0;
    float zt = m[3][2];
    float xt = m[3][0];
    vec3 color;
    if (ns_edge) {
        if (x_margin || y_margin) {
            color = vec3(0.0);
        } else {
            color = rainbow(float(u_time) + zt - xt);
        }
    } else {
        if (z_margin || y_margin) {
            color = vec3(0.0);
        } else {
            color = rainbow(float(u_time) + zt - xt);
        }
    }
    gl_FragColor = vec4(color, 1.0);
}
