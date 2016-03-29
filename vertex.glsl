precision mediump int;
uniform int u_time;
attribute vec3 a_position;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

varying vec3 a;

void main() {
    a = a_position;
    mat4 wtf = mat4(1.0);
    wtf[3][1] = sin(float(u_time) / 60.0 + u_model[3][2]/10.0) / 1.5;
    wtf[3][1] += sin(float(u_time) / 60.0 + u_model[3][0]/10.0) / 1.5;
    gl_Position = u_proj * u_view * u_model * wtf * vec4(a_position, 1.0);
}
