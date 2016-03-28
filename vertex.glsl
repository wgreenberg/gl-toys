precision mediump int;
uniform int u_time;
attribute vec3 a_position;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

varying vec3 a;

void main() {
    a = a_position;
    gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
}
