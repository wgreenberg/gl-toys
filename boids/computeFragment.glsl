#extension GL_EXT_draw_buffers : require
precision highp float;

uniform int u_time;
uniform vec2 u_resolution;

uniform sampler2D u_prevP;
uniform sampler2D u_prevV;

#define DIM 64
#define BOX_SIZE 10.0
#define MAX_V 0.085
#define COMFORT_ZONE 0.4
#define NEIGHBOR_ZONE 0.5
#define MAX_R 10.0
#define CNT_STR 0.002

vec3 bound (vec3 p) {
    if (p.x > BOX_SIZE)
        p.x = -BOX_SIZE;
    if (p.x < -BOX_SIZE)
        p.x = BOX_SIZE;
    if (p.y > BOX_SIZE)
        p.y = -BOX_SIZE;
    if (p.y < -BOX_SIZE)
        p.y = BOX_SIZE;
    if (p.z > BOX_SIZE)
        p.z = -BOX_SIZE;
    if (p.z < -BOX_SIZE)
        p.z = BOX_SIZE;
    return p;
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;

    vec3 our_v = vec3(texture2D(u_prevV, uv));
    vec3 our_p = vec3(texture2D(u_prevP, uv));

    vec3 our_new_v = vec3(0.0);
    vec3 separation = vec3(0.0);
    vec3 cohesion = vec3(0.0);
    vec3 alignment = vec3(0.0);
    vec3 centering = length(our_p) > MAX_R ? -CNT_STR * our_p : vec3(0.0);

    int n_neighbors = 0, n_separated = 0;

    for (int i=0; i < DIM; i++) {
        for (int j=0; j < DIM; j++) {
            float x = float(i)/float(DIM);
            float y = float(j)/float(DIM);
            vec2 coord = vec2(x, y);

            vec3 their_v = vec3(texture2D(u_prevV, coord));
            vec3 their_p = vec3(texture2D(u_prevP, coord));

            if (coord == uv)
                continue;

            float d = distance(their_p, our_p);
            if (d < COMFORT_ZONE) {
                separation -= (their_p - our_p);
            }
            if (d < NEIGHBOR_ZONE) {
                alignment += their_v;
                cohesion += their_p;
                n_neighbors++;
            }
        }
    }

    cohesion /= float(n_neighbors);
    cohesion -= our_p;
    cohesion /= 100.0;

    alignment /= float(n_neighbors);
    alignment *= 8.0;

    our_new_v = normalize(our_v + centering + separation + cohesion + alignment) * MAX_V;

    vec3 our_new_p = our_p + our_new_v;

    gl_FragData[0] = vec4(our_new_p, 1.0);
    gl_FragData[1] = vec4(our_new_v, 1.0);
}
