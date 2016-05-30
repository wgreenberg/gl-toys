attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_viewproj;

varying vec3 v_interpolatedNormal;
varying vec3 v_vertPos;

void main() {
    vec4 world_position = u_model * vec4(a_position, 1.0);
    v_vertPos = world_position.rgb;
    v_interpolatedNormal = mat3(u_model) * a_normal;
    gl_Position = u_viewproj * world_position;
}
