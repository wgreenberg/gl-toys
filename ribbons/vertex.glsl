attribute vec3 a_position;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform float u_top_rad;
uniform float u_bot_rad;
uniform vec3 u_reverseLightDir;

varying vec3 v_position;
varying float light;

mat4 rotateY (float rad) {
    mat4 rotate = mat4(1.0);
    rotate[0][0] = cos(rad);
    rotate[2][2] = cos(rad);
    rotate[0][2] = -sin(rad);
    rotate[2][0] =  sin(rad);
    return rotate;
}

void main() {
    float height_pct = (a_position.y + 1.0) / 2.0;
    float vert_rad = mix(u_bot_rad, u_top_rad, height_pct);
    v_position = a_position;
    mat4 rotation = rotateY(vert_rad);
    gl_Position = u_proj * u_view * u_model * rotation * vec4(a_position, 1.0);

    // hack to make both sides of the strip have a normal
    vec3 normal;
    if (cos(vert_rad) >= 0.0)
        normal = vec3(0.0, 0.0, 1.0);
    else
        normal = vec3(0.0, 0.0, -1.0);
    normal = mat3(rotation) * normal;
    light = dot(normalize(normal), normalize(u_reverseLightDir));
}

