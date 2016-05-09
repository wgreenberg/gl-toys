precision highp float;

uniform int u_time;

uniform sampler2D u_currP;

vec2 canvas_size = vec2(512.0, 512.0);
void main() {
    vec4 p = texture2D(u_currP, gl_FragCoord.xy / canvas_size);
    float m;
    m = max(p[0], p[1]);
    m = max(m, p[2]);
    m = max(m, p[3]);
    p[0] /= m;
    p[1] /= m;
    p[2] /= m;
    gl_FragColor = vec4(p[0], p[1], p[2], 1.0);
}
