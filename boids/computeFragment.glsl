#extension GL_EXT_draw_buffers : require
precision highp float;

uniform int u_time;
uniform vec2 u_resolution;

uniform sampler2D u_prevP;
uniform sampler2D u_prevV;

uniform float u_boxSize;
uniform float u_comfortZone;
uniform float u_alignmentC;
uniform float u_cohesionC;
uniform float u_randomC;
uniform float u_separationC;
uniform float u_maxV;

#define DIM 64
#define MAX_R 30.0
#define CNT_STR 0.008
#define N_NEIGHBORS 8

vec3 bound (vec3 p) {
    float half_box = u_boxSize / 2.0;
    if (p.x > half_box)
        p.x -= u_boxSize;
    if (p.x < -half_box)
        p.x += u_boxSize;
    if (p.y > half_box)
        p.y -= u_boxSize;
    if (p.y < -half_box)
        p.y += u_boxSize;
    if (p.z > half_box)
        p.z -= u_boxSize;
    if (p.z < -half_box)
        p.z += u_boxSize;
    return p;
}

// one liner prng from http://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float rand(vec2 co){
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453) - 0.5;
}

vec3 randvec3(int t, vec3 pos) {
    float x = rand(vec2(float(t), pos.x));
    float y = rand(vec2(float(t), pos.y));
    float z = rand(vec2(float(t), pos.z));
    return vec3(x, y, z);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;

    vec3 our_v = vec3(texture2D(u_prevV, uv));
    vec3 our_p = vec3(texture2D(u_prevP, uv));

    vec3 our_new_v = vec3(0.0);
    vec3 separation = vec3(0.0);
    vec3 cohesion = vec3(0.0);
    vec3 alignment = vec3(0.0);
    vec3 centering = length(our_p) > MAX_R && false ? -CNT_STR * our_p : vec3(0.0);
    vec3 random = randvec3(u_time, our_p);

    // d, u, v
    vec3 closest_neighbors[N_NEIGHBORS];

    for (int i=0; i < N_NEIGHBORS; i++) {
        closest_neighbors[i] = vec3(-1.0, 1.0, 0.0);
    }

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
            if (d < u_comfortZone) {
                separation -= (their_p - our_p);
            }

            vec3 furthest_neighbor = closest_neighbors[N_NEIGHBORS - 1];
            if (furthest_neighbor.x == -1.0 || furthest_neighbor.x > d) {
                bool inserted = false;
                vec3 temp, last;
                for (int k=0; k < N_NEIGHBORS; k++) {
                    vec3 neighbor = closest_neighbors[k];
                    // If we've already inserted this boid into the neighbors list,
                    // just bump the last neighbor down the line
                    if (inserted) {
                        temp = neighbor;
                        closest_neighbors[k] = last;
                        last = temp;
                        continue;
                    }
                    if (neighbor.x == -1.0 || neighbor.x > d) {
                        inserted = true;
                        last = neighbor;
                        closest_neighbors[k].x = d;
                        closest_neighbors[k].yz = coord;
                    }
                }
            }
        }
    }

    for (int i=0; i < N_NEIGHBORS; i++) {
        vec2 coord = closest_neighbors[i].yz;
        vec3 their_v = vec3(texture2D(u_prevV, coord));
        vec3 their_p = vec3(texture2D(u_prevP, coord));

        alignment += their_v;
        cohesion += their_p;
    }

    cohesion /= float(N_NEIGHBORS);
    cohesion -= our_p;

    alignment /= float(N_NEIGHBORS);

    cohesion *= u_cohesionC;
    alignment *= u_alignmentC;
    separation *= u_separationC;
    random *= u_randomC;

    our_new_v = normalize(our_v + centering + separation + cohesion + alignment + random) * u_maxV;
    //our_new_v = normalize(our_v) * u_maxV;

    vec3 our_new_p = bound(our_p + our_new_v);

    gl_FragData[0] = vec4(our_new_p, 1.0);
    gl_FragData[1] = vec4(our_new_v, 1.0);
}
