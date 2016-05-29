precision mediump float;

uniform int u_time;

varying vec3 v_normal;
varying vec3 v_reverseLightDir;

void main() {
    float light = dot(v_normal, normalize(v_reverseLightDir));
    gl_FragColor = vec4(vec3(1.0) * light, 1.0);
}
