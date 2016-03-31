attribute vec3 a_position;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform vec3 u_reverseLightDir;

varying vec3 v_position;
varying float light;

void main() {
    v_position = a_position;
    gl_Position = u_proj * u_view * u_model * vec4(a_position, 1.0);

    // we only care about the front face's normal
    vec3 normal = normalize(vec3(0.0, 0.0, 1.0));
    normal = mat3(u_model) * normal;
    light = dot(normalize(normal), normalize(u_reverseLightDir));
}

