precision mediump float;

uniform int u_time;
uniform float u_ambient;
uniform float u_shininess;
uniform float u_attenuation;

varying vec3 v_interpolatedNormal;
varying vec3 v_surfaceToCamera;
varying vec3 v_surfaceToLight;

float PI = 3.14159;
// pretty colors
vec3 rainbow (float t) {
    // hsl-ish via
    // http://www.quasimondo.com/archives/000696.php#000696
    t = t * (PI / 180.0);
    float saturation = 0.8;
    float luminance = 0.5;
    float u = cos(t) * saturation;
    float v = sin(t) * saturation;
    float r =  luminance  + 1.139837398373983740  * v;
    float g = luminance  - 0.3946517043589703515  * u - 0.5805986066674976801 * v;
    float b = luminance + 2.03211091743119266 * u;
    return vec3 (r,g,b);
}

vec4 phong () {
    vec3 normal = normalize(v_interpolatedNormal);
    vec3 surfaceToLight = normalize(v_surfaceToLight);
    vec4 rabbitColor = vec4(vec3(0.3), 1.0);
    vec4 rabbitSpecularColor = vec4(vec3(0.1), 1.0);
    vec4 lightColor = vec4(rainbow(float(u_time)), 1.0);

    float ambient = u_ambient;

    float diffuse = max(0.0, dot(normal, surfaceToLight));

    float specular = 0.0;
    if (diffuse > 0.0) {
        vec3 incidence = -normalize(v_surfaceToLight);
        vec3 reflection = reflect(incidence, normal);
        float cosAngle = max(0.0, dot(normalize(v_surfaceToCamera), reflection));
        specular = pow(cosAngle, u_shininess);
    }

    float distToLight = length(v_surfaceToLight);
    float attenuation = 1.0 / (1.0 + u_attenuation * pow(distToLight, 2.0));

    vec3 total = (ambient + attenuation * diffuse) * rabbitColor.rgb;
    total += attenuation * specular * rabbitSpecularColor.rgb;
    total *= lightColor.rgb;

    return vec4(total, 1.0);
}

void main() {
    gl_FragColor = phong();
}
