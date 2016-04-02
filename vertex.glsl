attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_reverseLightDir;

varying float light;
varying vec2 v_uv;

void main() {
    v_uv = a_uv;
    gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);

    vec3 normal = normalize(a_normal);
    normal = mat3(u_model) * normal;
    light = dot(normalize(normal), normalize(u_reverseLightDir));
}

