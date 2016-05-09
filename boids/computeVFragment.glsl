precision highp float;

uniform int u_time;

uniform sampler2D u_currP;
uniform sampler2D u_prevP;
uniform sampler2D u_currV;
uniform sampler2D u_prevV;

varying vec2 v_uv;

void main() {
    vec3 v = vec3(texture2D(u_currV, v_uv));
    vec3 new_v = v + vec3(1.0);
    gl_FragColor = vec4 (new_v, 1.0);
}
