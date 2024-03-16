attribute vec3 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;

varying vec3 v_texcoord;

void main() {
    vec3 positionVS = mat3(u_view) * (a_position);
    gl_Position = u_projection * vec4(positionVS, 1.0);
    // gl_Position = u_projection * u_view * u_world * vec4(a_position, 1.0);
    v_texcoord = a_position;
}