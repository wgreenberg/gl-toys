precision mediump int;
precision highp float;
attribute vec3 a_position;

uniform int u_time;

varying vec2 v_screenPos;

void main () {
    v_screenPos = -1.0 * a_position.xy;
    gl_Position = vec4 (a_position, 1.0);
}

