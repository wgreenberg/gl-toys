precision mediump float;

uniform sampler2D u_tex;
uniform int u_time;

varying vec2 v_uv;
varying vec3 v_position;

void main() {
    vec3 a = v_position;
    gl_FragColor = texture2D(u_tex, v_uv);
}
