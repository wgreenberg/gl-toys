precision mediump int;
precision highp float;

attribute vec3 a_position;
attribute vec2 a_uv;

uniform int u_time;

varying vec2 v_uv;

void main () {
    v_uv = a_uv;
    gl_Position = vec4 (a_position, 1.0);
}

