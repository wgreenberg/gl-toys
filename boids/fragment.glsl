precision highp float;

uniform int u_time;

varying vec2 v_uv;

uniform sampler2D u_currP;
uniform sampler2D u_prevP;
uniform sampler2D u_currV;
uniform sampler2D u_prevV;

void main() {
    //gl_FragColor = vec4 (length(v_uv), length(v_uv), length(v_uv), 1.0);
    gl_FragColor = vec4 (vec3(texture2D(u_currP, v_uv)), 1.0);
}
