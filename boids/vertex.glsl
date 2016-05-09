precision mediump int;
precision highp float;

attribute vec2 a_uv;

uniform int u_time;
uniform sampler2D u_currP;

varying vec2 v_uv;

void main () {
    v_uv = a_uv;
    vec3 pos = vec3(texture2D(u_currP, a_uv));
    //gl_Position = vec4 (pos, 1.0);
    gl_Position = vec4 (a_uv, 0.0, 1.0);
    gl_PointSize = 10.0;
}

