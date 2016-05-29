attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_reverseLightDir;

varying vec3 v_normal;
varying vec3 v_reverseLightDir;

void main() {
    v_normal = mat3(u_model) * a_normal;
    v_reverseLightDir = u_reverseLightDir;
    gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);
}

