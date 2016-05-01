precision highp float;

uniform int u_time;

varying float v_x;
varying float v_y;

float PI = 3.14159;
#define MAX_ITER 200
#define MAX_VAL 100.0

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
    return vec3 (r,g,b);
}

vec3 point_color (float x0, float y0) {
    float x, y, xtemp;
    x = y = 0.0;
    int escape = 0;
    for (int i=0; i < MAX_ITER; i++) {
        xtemp = x*x - y*y + x0;
        y = 2.0*x*y + y0;
        x = xtemp;
        if (x*x + y*y > MAX_VAL) {
            escape = i;
            break;
        }
    }
    if (escape > 0) {
        float log_zn = log(x*x + y*y) / 2.0;
        float nu = log(log_zn / log(2.0)) / log(2.0);
        float v = (float(escape + 1 + u_time) - nu) * 5.0;
        vec3 lo = rainbow(floor(v));
        vec3 hi = rainbow(floor(v) + 1.0);
        return mix(lo, hi, v - floor(v));
    } else {
        return vec3(0.0);
    }
}

void main() {
    float t = float (u_time);
    gl_FragColor = vec4 (point_color (v_x, v_y), 1.0);
}
