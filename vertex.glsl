attribute vec3 a_position;

void main() {
    vec3 pos = a_position;

    pos.x = pos.x/pos.z;
    pos.y = pos.y/pos.z;
    pos.z = 1.0;

    gl_Position = vec4(pos, 1.0);
}
