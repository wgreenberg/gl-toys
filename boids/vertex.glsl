precision mediump int;
precision highp float;

attribute vec2 a_uv;

uniform int u_time;
uniform sampler2D u_currP;
uniform sampler2D u_currV;
uniform mat4 u_proj;

varying vec2 v_uv;

uniform float u_boxSize;
uniform vec3 u_cameraPos;

float minPointScale = 0.1;
float maxPointScale = 1.0;
float maxDistance = max(u_cameraPos.z, 100.0);

void main () {
    v_uv = a_uv;
    vec3 pos = vec3(texture2D(u_currP, a_uv));
    vec3 vel = vec3(texture2D(u_currV, v_uv));

    pos.z -= u_cameraPos.z;

    float cameraDist = length(pos);
    float pointScale = 1.0 - (cameraDist / maxDistance);
    pointScale = max(pointScale, minPointScale);
    pointScale = min(pointScale, maxPointScale);

    gl_PointSize = 10.0 * pointScale;
    gl_Position = u_proj * vec4 (pos, 1.0);
}

