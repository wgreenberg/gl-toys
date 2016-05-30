precision mediump float;

uniform int u_time;
uniform float u_ambient;
uniform float u_shininess;
uniform float u_attenuation;
uniform vec3 u_lightPos;
uniform vec3 u_cameraPos;
uniform vec3 u_color;
uniform vec3 u_specularColor;

varying vec3 v_interpolatedNormal;
varying vec3 v_vertPos;

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
    vec3 lightColor = rainbow(float(u_time) / 2.0);

    vec3 normal = normalize(v_interpolatedNormal);
    vec3 surfaceToLight = u_lightPos - v_vertPos;
    float distToLight = length(surfaceToLight);
    surfaceToLight = normalize(surfaceToLight);

    float attenuation = 1.0 / (1.0 + u_attenuation * pow(distToLight, 2.0));
    float ambient = u_ambient;
    float diffuse = max(0.0, dot(normal, surfaceToLight));
    float specular = 0.0;

    if (diffuse > 0.0) {
        // Blinn-Phong specular shading
        vec3 surfaceToCamera = normalize(u_cameraPos - v_vertPos);
        vec3 halfDir = normalize(surfaceToLight + surfaceToCamera);
        float specAngle = max(0.0, dot(halfDir, normal));
        specular = pow(specAngle, u_shininess);
    }

    vec3 total = (ambient + attenuation * diffuse) * u_color;
    total += attenuation * specular * u_specularColor;
    total *= lightColor;

    // gamma correction
    total = pow(total, vec3(1.0/2.2));

    return vec4(total, 1.0);
}

void main() {
    gl_FragColor = phong();
}
