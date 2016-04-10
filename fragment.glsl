precision mediump float;

uniform sampler2D u_tex;
uniform int u_time;

varying vec2 v_uv;
varying vec3 v_position;

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
    vec3 a = v_position;
    float margin = 0.1;
    // paint borders of faces black
    bool x_margin = a.x < -1.0 + margin || a.x > 1.0 - margin;
    bool y_margin = a.y < -1.0 + margin || a.y > 1.0 - margin;
    bool z_margin = a.z < -1.0 + margin || a.z > 1.0 - margin;
    bool ns_edge = a.z == 1.0 || a.z == -1.0;
    bool top_bot = a.y == 1.0 || a.y == -1.0;
    vec3 color;

    float c = 15.0;
    float t = float(u_time) * 2.0;
    if (top_bot) {
        if (z_margin || x_margin) {
            gl_FragColor = vec4(rainbow(t + c * (a.x + a.z)), 1.0);
        } else {
            gl_FragColor = texture2D(u_tex, v_uv);
        }
    } else {
        if (ns_edge) {
            if (x_margin || y_margin) {
                gl_FragColor = vec4(rainbow(t + c * (a.y + a.z)), 1.0);
            } else {
                gl_FragColor = texture2D(u_tex, v_uv);
            }
        } else {
            if (z_margin || y_margin) {
                gl_FragColor = vec4(rainbow(t + c * (a.z + a.y)), 1.0);
            } else {
                gl_FragColor = texture2D(u_tex, v_uv);
            }
        }
    }
}
