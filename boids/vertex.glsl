precision mediump int;
precision highp float;

attribute vec2 a_uv;

uniform int u_time;
uniform sampler2D u_currP;
uniform mat4 u_proj;
uniform mat4 u_view;

varying vec2 v_uv;

float minPointScale = 0.1;
float maxPointScale = 1.0;
float maxDistance = 10.0;

void main () {
    v_uv = a_uv;
    vec3 pos = vec3(texture2D(u_currP, a_uv));
    pos.z -= 20.0;

    float cameraDist = length(pos);
    float pointScale = 1.0 - (cameraDist / maxDistance);
    pointScale = max(pointScale, minPointScale);
    pointScale = min(pointScale, maxPointScale);

    gl_PointSize = 10.0 * pointScale;
    gl_Position = u_proj * vec4 (pos, 1.0);
}

