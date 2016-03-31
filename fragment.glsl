precision mediump float;

varying vec3 v_position;
varying float light;

void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.5, 1.0);
    gl_FragColor.rgb *= light;
}
