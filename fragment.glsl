precision mediump float;
varying vec3 a;

float margin = 0.1;

void main() {
    // paint borders of faces black, else gray
    bool x_margin = a.x < -1.0 + margin || a.x > 1.0 - margin;
    bool y_margin = a.y < -1.0 + margin || a.y > 1.0 - margin;
    bool z_margin = a.z < -1.0 + margin || a.z > 1.0 - margin;
    bool ns_edge = a.z == 1.0 || a.z == -1.0;
    vec3 color;
    if (ns_edge) {
        if (x_margin || y_margin) {
            color = vec3(0.0);
        } else {
            color = vec3(0.5);
        }
    } else {
        if (z_margin || y_margin) {
            color = vec3(0.0);
        } else {
            color = vec3(0.5);
        }
    }
    gl_FragColor = vec4(color, 1.0);
}
