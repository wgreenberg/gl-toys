precision mediump int;
precision highp float;
attribute vec3 a_position;

uniform vec2 u_location;
uniform int u_time;
uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_proj;

void main () {
    gl_Position = u_proj * u_view * u_model * vec4 (a_position, 1.0);
}

