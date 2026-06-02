attribute vec3 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_local_pos;

void main() {
    vec3 pos = a_position;
    v_local_pos = pos;
    gl_Position = u_projection * u_view * u_world * vec4(pos, 1.0);
}