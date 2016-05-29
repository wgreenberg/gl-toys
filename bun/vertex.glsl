attribute vec3 a_position;
attribute vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_surfaceToLight;
uniform vec3 u_cameraPos;
uniform vec3 u_lightPos;

varying vec3 v_normal;
varying vec3 v_surfaceToCamera;
varying vec3 v_surfaceToLight;

void main() {
    vec4 world_position = u_model * vec4(a_position, 1.0);
    v_normal = mat3(u_model) * a_normal;
    v_surfaceToCamera = normalize(u_cameraPos - world_position.rgb);
    v_surfaceToLight = normalize(u_lightPos - world_position.rgb);
    gl_Position = u_proj * u_view * world_position;
}

