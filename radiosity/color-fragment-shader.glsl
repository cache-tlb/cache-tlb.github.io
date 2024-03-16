precision mediump float;
varying vec4 v_color;

void main() {
    gl_FragColor = vec4(pow(v_color.rgb, vec3(0.454545)), 1.0);
}