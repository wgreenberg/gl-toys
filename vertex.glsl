precision mediump int;
uniform int u_time;
attribute vec3 a_position;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

varying vec3 a;
varying mat4 m;

void main() {
    a = a_position;
    m = u_model;
    mat4 wtf = mat4(1.0);
    float zt = u_model[3][2];
    float xt = u_model[3][0];
    wtf[3][1] = sin(float(u_time) / 100.0 + zt/10.0) / 2.5;
    wtf[3][1] += sin(float(u_time) / 100.0 + xt/10.0) / 2.5;
    gl_Position = u_proj * u_view * u_model * wtf * vec4(a_position, 1.0);
}
