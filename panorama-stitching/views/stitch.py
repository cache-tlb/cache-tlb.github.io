import math
import cv2
import numpy as np

def deg_to_radian(deg):
    return deg / 180.0 * math.pi

def clamp(x, low, high):
    return low if x < low else (high if x > high else x)

def yaw_pitch_to_vector(yaw, pitch):
    return np.array([math.cos(pitch)*math.cos(yaw), math.cos(pitch)*math.sin(yaw), math.sin(pitch)])

def im_sample_clamp_int(im, xy):
    h = im.shape[0]
    w = im.shape[1]
    x = clamp(xy[0], 0, w - 1)
    y = clamp(xy[1], 0, h - 1)
    return im[y,x]

def im_sample(im, uv):
    h = im.shape[0]
    w = im.shape[1]
    xf = uv[0] * w
    yf = uv[1] * h
    x = math.floor(xf - 0.5)
    y = math.floor(yf - 0.5)
    xt = xf - 0.5 - x
    yt = yf - 0.5 - y
    c00 = im_sample_clamp_int(im, (x,y))
    c01 = im_sample_clamp_int(im, (x,y+1))
    c10 = im_sample_clamp_int(im, (x+1,y))
    c11 = im_sample_clamp_int(im, (x+1,y+1))
    c = (1-xt)*(1-yt)*c00 + (1-xt)*yt*c01 + xt*(1-yt)*c10 + xt*yt*c11
    return c

# views = [(0,0),(90,0),(180,0),(270,0),(0,60),(90,60),(180,60),(270,60),(0,-60),(90,-60),(180,-60),(270,-60)]
# im_paths = ['X41.9_Y450.2_Z47.5_Pitch%.1f_Yaw%.1f.jpg' % (pitch,yaw) for (yaw,pitch) in views]
# im_paths = ['Panoramic_PaneX_%d_PaneY_%d_0_L.bmp' % (i,j) for i in range(8)]
im_paths = []
views = []
xs = [150,-150,90,-90,30,-30]
ys = [60,-60,0]
for i in range(6):
    for j in range(3):
        im_path = 'Panoramic_PaneX_%d_PaneY_%d_0_L.bmp' % (i,j)
        im_paths.append(im_path)
        yaw = xs[i]
        pitch = ys[j]
        views.append((yaw,pitch))
ims = []
im_count = len(views)

for im_path in im_paths:
    im = cv2.imread(im_path)
    im = cv2.cvtColor(im, cv2.COLOR_RGB2BGR, cv2.CV_32FC3)
    ims.append(im / 255.0)


# pano_w = 512
# pano_h = 256
# pano = np.zeros((pano_h, pano_w, 3), np.float32)
# for i in range(pano_h):
#     for j in range(pano_w):
#         pano_pitch = 90 - (i+0.5) / float(pano_h) * 180
#         pano_yaw = (j+0.5) / float(pano_w) * 360
#         theta, phi = deg_to_radian(pano_pitch), deg_to_radian(pano_yaw)
#         pano_vec = yaw_pitch_to_vector(phi, theta)
#         c = np.zeros((3,), np.float32)
#         s = 0
#         for k in range(im_count):
#             (view_yaw, view_pitch) = views[k]
#             theta_v, phi_v = deg_to_radian(view_pitch), deg_to_radian(view_yaw)
#             view_vec = yaw_pitch_to_vector(phi_v, theta_v)
#             if np.dot(view_vec, pano_vec) < -0.5:
#                 continue

#             delta_phi = phi - phi_v
            
#             y = (math.tan(theta) - math.tan(theta_v)*math.cos(delta_phi)) / (math.cos(delta_phi) + math.tan(theta_v)*math.tan(theta))
#             x = math.tan(delta_phi) * (math.cos(theta_v) - y*math.sin(theta_v))
#             if -1 < x and x < 1 and -1 < y and y < 1:
#                 viewport_c = im_sample(ims[k], (x*0.5+0.5, 1.0 - (y*0.5+0.5)))
#                 wx = math.cos(abs(x)*math.pi*0.5)
#                 wy = math.cos(abs(y)*math.pi*0.5)
#                 w = wx*wy
#                 c[:] += viewport_c * w
#                 s += w

#         pano[i,j,:] = c[:] / s
# pano = cv2.cvtColor(pano, cv2.COLOR_RGB2BGR, cv2.CV_8UC3)
# cv2.imshow('title', pano)
# cv2.waitKey(0)

def get_cubemap_direction(face_id, u, v):
    if face_id == 0: # done
        return [u,v,1]
    elif face_id == 2: # done
        return [-u,v,-1]
    elif face_id == 1: # done
        return [1,v,-u]
    elif face_id == 4: # done
        return [-1,v,u]
    elif face_id == 5:
        return [u,-1,v]
    elif face_id == 3: # done
        return [u,1,-v]
    else:
        return None

scale = 1
pad = 1 * scale
cube_face_size = 400 * scale
cubemap_w = cube_face_size*3
cubemap_h = cube_face_size*2
cubemap = np.zeros((cubemap_h, cubemap_w, 3), np.float32)
for face in range(6):
    offset_x = (face % 3) * cube_face_size
    offset_y = (face // 3) * cube_face_size
    for i in range(cube_face_size):
        for j in range(cube_face_size):
            u = (j+0.5-cube_face_size/2) / (cube_face_size/2 - pad)
            v = (i+0.5-cube_face_size/2) / (cube_face_size/2 - pad)
            vec = get_cubemap_direction(face, u, v)
            vec = np.array(vec)
            unit_vec = vec / np.linalg.norm(vec)
            res_pitch = math.asin(-unit_vec[1]);
            res_yaw = math.atan2(unit_vec[0], unit_vec[2])
            theta, phi = res_pitch, res_yaw
            pano_vec = yaw_pitch_to_vector(phi, theta)
            c = np.zeros((3,), np.float32)
            s = 0
            for k in range(im_count):
                (view_yaw, view_pitch) = views[k]
                theta_v, phi_v = deg_to_radian(view_pitch), deg_to_radian(view_yaw)
                view_vec = yaw_pitch_to_vector(phi_v, theta_v)
                if np.dot(view_vec, pano_vec) < -0.5:
                    continue

                delta_phi = phi - phi_v
                
                y = (math.tan(theta) - math.tan(theta_v)*math.cos(delta_phi)) / (math.cos(delta_phi) + math.tan(theta_v)*math.tan(theta))
                x = math.tan(delta_phi) * (math.cos(theta_v) - y*math.sin(theta_v))
                if -1 < x and x < 1 and -1 < y and y < 1:
                    viewport_c = im_sample(ims[k], (x*0.5+0.5, 1.0 - (y*0.5+0.5)))
                    wx = math.cos(abs(x)*math.pi*0.5)
                    wy = math.cos(abs(y)*math.pi*0.5)
                    w = wx*wy
                    c[:] += viewport_c * w
                    s += w
            cubemap[offset_y+i,offset_x+j,:] = c[:] / s

            # break
        # break
    # break

cubemap = cv2.cvtColor(cubemap, cv2.COLOR_RGB2BGR, cv2.CV_8UC3)
# cv2.imwrite('res.png', cubemap)
cv2.imshow('title', cubemap)
cv2.waitKey(0)

