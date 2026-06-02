precision highp float;
uniform samplerCube u_texture;
uniform int u_mode;
uniform int u_showDiff;
uniform float u_diffScale;

varying vec3 v_local_pos;

#define PI 3.14159265359

vec3 get_axis_val(int axis, float s)
{
    vec3 ret = vec3(0.0);
    if (axis == 0) ret.x = 1.0;
    else if (axis == 1) ret.y = 1.0;
    else if (axis == 2) ret.z = 1.0;
    ret = (0.5 - 0.5*s)*vec3(1.0, 1.0, 1.0) + s*ret;
    return ret;
}

float solid_angle(vec3 p1, vec3 p2, vec3 p3)
{
    vec3 n1 = normalize(cross(p2, p3));
    vec3 n2 = normalize(cross(p3, p1));
    vec3 n3 = normalize(cross(p1, p2));
    float a1 = acos(-dot(n2, n3));
    float a2 = acos(-dot(n3, n1));
    float a3 = acos(-dot(n1, n2));
    return a1+a2+a3 - PI;
}

float area(vec3 p1, vec3 p2, vec3 p3)
{
    vec3 v1 = p2 - p1, v2 = p3 - p1;
    // return 0.5*length(cross(v1, v2));
    return 0.5*sqrt(dot(v1,v1)*dot(v2,v2) - dot(v1,v2)*dot(v1,v2));
}

vec4 cubemapInterpolation(vec3 dir_normalized)
{
    // color1 <- directly sample cubemap
    vec3 color1 = textureCube(u_texture, dir_normalized).xyz;
    // return textureCube(u_texture, dir_normalized);

    // color2 <- face color
    vec3 sign_dir = sign(dir_normalized);
    vec3 abs_dir = abs(dir_normalized);
    float max_asix_val = max(max(abs_dir.x, abs_dir.y), abs_dir.z);
    int axis = -1;
    float s = 0.0;
    if (abs_dir.x == max_asix_val) {
        axis = 0;
        s = sign_dir.x;
    } else if (abs_dir.y == max_asix_val) {
        axis = 1;
        s = sign_dir.y;
    } else if (abs_dir.z == max_asix_val) {
        axis = 2;
        s = sign_dir.z;
    }
    vec3 color2 = get_axis_val(axis, s);

    // color3 <- spherical barycenteric
    vec3 axis_x = vec3(1.0, 0.0, 0.0) * sign_dir;
    vec3 axis_y = vec3(0.0, 1.0, 0.0) * sign_dir;
    vec3 axis_z = vec3(0.0, 0.0, 1.0) * sign_dir;
    float sa = solid_angle(axis_x, axis_y, axis_z);
    float sa1 = solid_angle(dir_normalized, axis_y, axis_z);
    float sa2 = solid_angle(axis_x, dir_normalized, axis_z);
    float sa3 = solid_angle(axis_x, axis_y, dir_normalized);

    vec3 cx = get_axis_val(0, sign_dir.x);
    vec3 cy = get_axis_val(1, sign_dir.y);
    vec3 cz = get_axis_val(2, sign_dir.z);
    vec3 f = vec3(sa1, sa2, sa3) / sa;
    vec3 color3 = f.x * cx + f.y*cy + f.z*cz;

    // color4 <- project to octahedron
    float t = 1.0 / dot(vec3(1.0,1.0,1.0), abs(dir_normalized));
    vec3 p = t*dir_normalized;
    float a = area(axis_x, axis_y, axis_z);
    float a1 = area(p, axis_y, axis_z);
    float a2 = area(axis_x, p, axis_z);
    float a3 = area(axis_x, axis_y, p);

    vec3 ff = vec3(a1, a2, a3) / a;
    vec3 color4 = ff.x * cx + ff.y*cy + ff.z*cz;

    // color5 <- bilinear interpolation on one face
    vec3 color5 = vec3(0.);
    {
        vec3 uv_tmp = abs_dir / max_asix_val;
        vec3 c1 = color2;
        vec3 c2,c3;
        vec2 uv;
        if (axis == 0) {
            c2 = cy;
            c3 = cz;
            uv = uv_tmp.yz;
        } else if (axis == 1) {
            c2 = cz;
            c3 = cx;
            uv = uv_tmp.zx;
        } else if (axis == 2) {
            c2 = cx;
            c3 = cy;
            uv = uv_tmp.xy;
        }
        /*vec3 A = c1, B = (c1+c2)*0.5, C = (c1+c3)*0.5, D = (c1+c2+c3)/3.0;
        float u = uv.x, v = uv.y;*/
        vec3 A = c1, B = c2, C = c3, D = (c1+c2+c3)/3.0;
        float u = uv.x*0.5, v = uv.y*0.5;
        color5 = A*(1.0-u)*(1.0-v) + B*u*(1.0-v) + C*(1.0-u)*v + D*u*v;
        // color5 = vec3(uv, 0.0);
    }
    // return vec4(color5, 1.0);

    vec3 ret = vec3(0.0);
    if (u_mode == 1) {
        ret = color1;
    } else if (u_mode == 2) {
        ret = color2;
    } else if (u_mode == 3) {
        ret = color3;
    } else if (u_mode == 4) {
        ret = color4;
    } else {
        ret = color5;
    }

    if (u_showDiff > 0) {
        ret = abs(ret - color1) * u_diffScale;
    }

    return vec4(ret, 1.0);
}

void main() {
    // gl_FragColor = vec4(normalize(v_local_pos), 1.0);
    gl_FragColor = cubemapInterpolation(normalize(v_local_pos));
}