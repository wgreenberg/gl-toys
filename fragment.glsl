precision mediump float;

uniform sampler2D u_tex;

varying vec2 v_uv;
varying float light;

void main() {
    gl_FragColor = texture2D(u_tex, v_uv);
    gl_FragColor.rgb *= light;
}
