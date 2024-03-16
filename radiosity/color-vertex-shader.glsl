attribute vec3 a_position;
attribute vec4 a_color;

uniform mat4 u_projection;
uniform mat4 u_view;

varying vec4 v_color;

void main() {
    vec3 pos = a_position;
    v_color = a_color;
    gl_Position = u_projection * u_view * vec4(pos, 1.0);
}