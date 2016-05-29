precision mediump float;

uniform int u_time;

varying vec3 v_normal;
varying vec3 v_surfaceToCamera;
varying vec3 v_surfaceToLight;

vec4 phong () {
    vec3 surfaceToLight = normalize(v_surfaceToLight);
    vec4 rabbitColor = vec4(vec3(0.1), 1.0);
    vec4 rabbitSpecularColor = vec4(vec3(0.3), 1.0);
    vec4 lightColor = vec4(0.0, 1.0, 0.0, 1.0);

    float ambient = 1.0;

    float diffuse = dot(v_normal, surfaceToLight);

    float shininess = 3.0;
    vec3 incidence = -v_surfaceToLight;
    vec3 reflection = reflect(incidence, v_normal);
    float cosAngle = max(0.0, dot(v_surfaceToCamera, reflection));
    float specular = pow(cosAngle, shininess);

    vec3 total = (ambient + diffuse) * rabbitColor.rgb;
    total += specular * rabbitSpecularColor.rgb;
    total *= lightColor.rgb;

    return vec4(total, 1.0);
}

void main() {
    gl_FragColor = phong();
}
