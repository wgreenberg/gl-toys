precision highp float;

uniform int u_time;

varying vec2 v_screenPos;

#define MAX_ITER 100
#define MAX_DIST 20.0
#define EPSILON 0.001

#define FREQ 20.0
#define SINT sin(float(u_time) / 20.0)
#define COST cos(float(u_time) / 20.0)

float sphere (vec3 pos, vec3 ctr, float radius) {
    return distance(pos, ctr) - radius;
}

float box (vec3 pos, vec3 dim, vec3 ctr) {
    return length(max(abs(pos) - dim, 0.0));
}

float plane (vec3 pos, vec3 norm, vec3 ctr) {
    return dot(pos, norm) + length(ctr);
}

float dist_field (vec3 pos) {
    float dist = 1.0;
    vec3 sphereCtr = vec3(1.0, 1.0, 0.0);
    float sphereRad = 1.0;
    vec3 boxDim = vec3(1.0, 1.0, 1.0);
    vec3 boxCtr = vec3(0.0, 0.0, 0.0);
    vec3 planeNorm = vec3(0.0, 1.0, 0.0);
    vec3 planeCtr = vec3(0.0, 0.0, -1.0);
    dist = min(dist, sphere(pos, sphereCtr, sphereRad));
    dist = min(dist, sphere(pos, vec3(sphereCtr.x, sphereCtr.y + 1.0, sphereCtr.z + 0.5), 0.3));
    dist = min(dist, sphere(pos, vec3(sphereCtr.x, sphereCtr.y + 1.0, sphereCtr.z - 0.5), 0.3));
    dist = min(dist, sphere(pos, sphereCtr, sphereRad));
    dist = min(dist, box(pos, boxDim, boxCtr));
    dist = min(dist, plane(pos, planeNorm, planeCtr));
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
    vec3 cam_origin = vec3(SINT * 5.0, 0.0, COST * 5.0);
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
        float specular = pow(diffuse, 32.0);
        gl_FragColor = vec4(vec3(diffuse + specular), 1.0);
    } else {
        gl_FragColor = vec4(vec3(1.0), 1.0);
    }
}
