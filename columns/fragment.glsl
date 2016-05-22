precision highp float;

uniform int u_time;

varying vec2 v_screenPos;

#define MAX_ITER 100
#define MAX_DIST 20.0
#define EPSILON 0.001

#define FREQ 100.0
#define SINT sin(float(u_time) / FREQ)
#define COST cos(float(u_time) / FREQ)

#define NUM_DIVOTS 30
#define PI 3.14
#define TAU 2.0*PI

float sphere (vec3 pos, vec3 ctr, float radius) {
    return distance(pos, ctr) - radius;
}

float box (vec3 pos, vec3 dim, vec3 ctr) {
    return length(max(abs(pos) - dim, 0.0));
}

float plane (vec3 pos, float y, int up) {
    if (up == 1)
        return pos.y - y;
    else
        return y - pos.y;
}

float cylinder (vec3 pos, vec3 ctr, float radius, float height) {
    float d = distance(pos.xz, ctr.xz) - radius;
    d = max(d, plane(pos, ctr.y + height/2.0, 1));
    d = max(d, plane(pos, ctr.y - height/2.0, 0));
    return d;
}

float column (vec3 pos, vec3 ctr, float radius, float height) {
    float pillar = cylinder(pos, ctr, radius, height);
    if (pillar >= 0.5) return pillar;
    radius += 0.05;
    float dist = pillar;
    for (int i=0; i < NUM_DIVOTS; i++) {
        float rad = TAU * (float(i) / float(NUM_DIVOTS));
        vec3 cut_ctr = vec3(ctr.x + sin(rad) * radius, ctr.y, ctr.z + cos(rad) * radius);
        float cut = cylinder(pos, cut_ctr, radius/10.0, height);
        dist = max(dist, -cut);
    }
    return dist;
}

float dist_field (vec3 pos) {
    float dist = 1.0;
    dist = min(dist, column(pos, vec3(0.0, -1.0, 0.0), 1.0, 0.99));
    dist = min(dist, column(pos, vec3(0.0, 0.0, 0.0), 1.0, 0.99));
    dist = min(dist, column(pos, vec3(0.0, 1.0, 0.0), 1.0, 0.99));
    return dist;
}

vec3 norm_field (vec3 pos) {
    vec2 eps = vec2(0.0, EPSILON);
    float dx = dist_field(pos + eps.yxx) - dist_field(pos - eps.yxx);
    float dy = dist_field(pos + eps.xyx) - dist_field(pos - eps.xyx);
    float dz = dist_field(pos + eps.xxy) - dist_field(pos - eps.xxy);
    return normalize(vec3(dx, dy, dz));
}

void main() {
    vec3 cam_origin = vec3(SINT*4.0, 0.0, COST*4.0);
    vec3 cam_target = vec3(0.0, 0.0, 0.0);
    vec3 up_dir = vec3(0.0, 1.0, 0.0);
    vec3 cam_dir = normalize(cam_target - cam_origin);
    vec3 cam_right = normalize(cross(up_dir, cam_origin));
    vec3 cam_up = cross(cam_dir, cam_right);
    vec3 ray_dir = normalize(cam_right * v_screenPos.x + cam_up * v_screenPos.y + cam_dir);

    float dist = EPSILON;
    float totalDist = 0.0;
    vec3 pos = cam_origin;
    for (int i=0; i < MAX_ITER; i++) {
        if (dist < EPSILON || totalDist > MAX_DIST)
            break;
        dist = dist_field(pos);
        totalDist += dist;
        pos += dist * ray_dir;
    }

    if (dist < EPSILON) {
        vec3 pos_norm = norm_field(pos);
        float diffuse = max(0.0, dot(-ray_dir, pos_norm));
        gl_FragColor = vec4(vec3(diffuse), 1.0);
    } else {
        gl_FragColor = vec4(vec3(1.0), 1.0);
    }
}
