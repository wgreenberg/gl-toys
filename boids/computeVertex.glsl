precision mediump int;
precision highp float;

attribute vec3 a_position;

uniform int u_time;

void main () {
    gl_Position = vec4 (a_position, 1.0);
}

