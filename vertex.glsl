attribute vec3 a_position;
attribute vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

varying vec3 v_position;
varying vec2 v_uv;

void main() {
    v_position = a_position;
    v_uv = a_uv;
    gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
}

