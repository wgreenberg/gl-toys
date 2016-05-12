precision mediump int;
precision highp float;

attribute vec3 a_position;
attribute vec2 a_uv;

uniform sampler2D u_currP;

void main () {
    gl_Position = vec4 (a_position, 1.0);
}

