precision highp float;

uniform int u_time;

varying vec2 v_uv;

uniform sampler2D u_currP;
uniform sampler2D u_currV;

void main() {
    gl_FragColor = vec4 (vec3(0.0), 1.0);
}
