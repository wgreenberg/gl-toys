precision mediump int;
precision highp float;
attribute vec3 a_position;

uniform vec2 u_location;
uniform int u_time;
uniform float u_zoom;

varying float v_x;
varying float v_y;

void main () {
    v_x = a_position.x / u_zoom + u_location.x;
    v_y = a_position.y / u_zoom + u_location.y;
    gl_Position = vec4 (a_position, 1.0);
}

