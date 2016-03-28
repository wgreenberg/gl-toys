precision mediump float;
uniform int u_time;
varying vec3 a;

float margin = 0.1;
float PI = 3.14;

// pretty colors
vec3 rainbow (int t) {
    t /= 2; // up dat frequency
    float r = sin(float(t) * (PI/180.0));
    float g = cos(float(t) * (PI/180.0) + 1.0);
    float b = sin(float(t) * (PI/180.0) + 2.0);
    return vec3(r,g,b);
}

void main() {
    // paint borders of faces black
    bool x_margin = a.x < -1.0 + margin || a.x > 1.0 - margin;
    bool y_margin = a.y < -1.0 + margin || a.y > 1.0 - margin;
    bool z_margin = a.z < -1.0 + margin || a.z > 1.0 - margin;
    bool ns_edge = a.z == 1.0 || a.z == -1.0;
    vec3 color;
    if (ns_edge) {
        if (x_margin || y_margin) {
            color = vec3(0.0);
        } else {
            // crazy rainbow shit
            if (sin(a.y * 10.0 + float(u_time)/10.0) > 0.0)
                color = vec3(rainbow(u_time));
            else
                color = vec3(0.9);
        }
    } else {
        if (z_margin || y_margin) {
            color = vec3(0.0);
        } else {
            // crazy rainbow shit
            if (sin(a.y * 10.0 + float(u_time)/10.0) > 0.0)
                color = vec3(rainbow(u_time));
            else
                color = vec3(0.9);
        }
    }
    gl_FragColor = vec4(color, 1.0);
}
