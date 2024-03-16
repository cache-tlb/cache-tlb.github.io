function degreeToRad(degree) { return degree*Math.PI/180.0; }

class Camera {
    constructor() {
        this.forward = [0,0,-1];    // -z
        this.right = [1,0,0];       // x
        this.position = [0,0,0];
    }
    moveForward(distance) {
        this.position = m4.addVectors( this.position, m4.scaleVector(this.forward, distance) );
    }
    moveRight(distance) {
        this.position = m4.addVectors( this.position, m4.scaleVector(this.right, distance) );
    }
    getViewMatrix() {
        var target = m4.addVectors(this.position, this.forward);
        var transform = m4.lookAt(this.position, target, [0,1,0]);
        return m4.inverse(transform);
    }
}

class UECameraControl {
    constructor(camera) {
        this.camera = camera;
        this.moveSpeed = 2;
        this.rotateSpeed = 1;
        this.isMoveForward = false;
        this.isMoveBackward = false;
        this.isMoveLeft = false;
        this.isMoveRight = false;
        this.yaw = 0;
        this.pitch = 0;
        this.maxPitch = 88;
        this.isLocked = true;
    }
    update(delta_t) {
        this.updateCameraPosition(delta_t);
        this.updateCameraRotation(delta_t);
    }
    updateCameraPosition(delta_t){
        var distance = delta_t * this.moveSpeed;
        if (this.isMoveForward && !this.isMoveBackward) {
            this.camera.moveForward(distance);
        }
        if (!this.isMoveForward && this.isMoveBackward) {
            this.camera.moveForward(-distance);
        }
        if (this.isMoveLeft && !this.isMoveRight) {
            this.camera.moveRight(-distance);
        }
        if (!this.isMoveLeft && this.isMoveRight) {
            this.camera.moveRight(distance);
        }
    }
    updateCameraRotation(delta_t){
        // yaw, pitch to forward & right
        var sin_pitch = Math.sin(degreeToRad(this.pitch));
        var sin_yaw = Math.sin(degreeToRad(this.yaw));
        var cos_yaw = Math.cos(degreeToRad(this.yaw));
        var xz_len = Math.sqrt(1.0 - sin_pitch*sin_pitch);
        var fwd = [-xz_len*sin_yaw, sin_pitch, -xz_len*cos_yaw];
        var right = [cos_yaw, 0, -sin_yaw];
        camera.forward = fwd;
        camera.right = right;
    }

    onKeyDown ( event ) {
        if (this.isLocked) return;
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW': this.isMoveForward = true; break;
            case 'ArrowLeft':
            case 'KeyA': this.isMoveLeft = true; break;
            case 'ArrowDown':
            case 'KeyS': this.isMoveBackward = true; break;
            case 'ArrowRight':
            case 'KeyD': this.isMoveRight = true; break;
        }
    };
    onKeyUp ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW': this.isMoveForward = false; break;
            case 'ArrowLeft':
            case 'KeyA': this.isMoveLeft = false; break;
            case 'ArrowDown':
            case 'KeyS': this.isMoveBackward = false; break;
            case 'ArrowRight':
            case 'KeyD': this.isMoveRight = false; break;
        }
    };
    onPointerMove( event ) {
        if (this.isLocked) return;
        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.yaw -= movementX * 0.05 * this.rotateSpeed;
        this.yaw = this.yaw % 360;
        this.pitch -= movementY * 0.05 * this.rotateSpeed;
        this.pitch = Math.max( -this.maxPitch, Math.min( this.maxPitch, this.pitch ) );
    }
    onPointerDown(event) {
        if (event.button == 2) {
            this.isLocked = false;
        }
    }
    onPointerUp(event) {
        if (event.button == 2) {
            this.isLocked = true;
        }
    }
    onContextmenu( event ) {
        event.preventDefault();
    }

    registerEventHandlers(domElement) {
        domElement.addEventListener( 'mouseup', this.onPointerUp.bind(this) );
        domElement.addEventListener( 'mousemove', this.onPointerMove.bind(this) );
        domElement.addEventListener( 'mousedown', this.onPointerDown.bind(this) );
        domElement.addEventListener( 'contextmenu', this.onContextmenu.bind(this) );
        window.addEventListener( 'keydown', this.onKeyDown.bind(this) );
        window.addEventListener( 'keyup', this.onKeyUp.bind(this) );
    }
}

const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext("2d");

var camera = null;
var cameraControl = null;
var cameraMoved = true;

var current_time = null;
var lastViewMat = null;

var imageData = null;
var width = 0, height = 0;
var useCorrection = false;

var positions = [ [0,0,0], [1,0,0], [0,1,0], [1,0,0], [1,1,0], [0,1,0] ];

function initScene() {
    camera = new Camera();
    camera.position = [0.5,0.5,3];

    cameraControl = new UECameraControl(camera);
    cameraControl.registerEventHandlers(window);

    canvas.width = window.innerWidth/2;
    canvas.height = window.innerHeight*0.75;
    width = canvas.width;
    height = canvas.height;
    imageData = ctx.createImageData(width, height);

}

function setCorrection() { useCorrection = document.getElementById('useCorrection').checked; }

function logicUpdate(delta_t) {
    cameraControl.update(delta_t);
    setCorrection();

    if (lastViewMat == null) cameraMoved = true;
    else {
        var viewMat = camera.getViewMatrix();
        var diff = 0.0;
        for (var i = 0; i < 16; i++) diff += Math.abs(lastViewMat[i] - viewMat[i]);
        cameraMoved = (diff > 1e-3);
    }
}

function postLogicUpdate(delta_t) {
    lastViewMat = Array.from(camera.getViewMatrix());
}

function sign (x1, y1, x2, y2, x3, y3)
{
    return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
}

function pointInTriangle (ptx, pty, x1, y1, x2, y2, x3, y3)
{
    var d1 = sign(ptx, pty, x1, y1, x2, y2);
    var d2 = sign(ptx, pty, x2, y2, x3, y3);
    var d3 = sign(ptx, pty, x3, y3, x1, y1);

    var has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    var has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(has_neg && has_pos);
}

function area(x1, y1, x2, y2, x3, y3)
{
    return x1*y2+x2*y3+x3*y1 - (x2*y1+x3*y2+x1*y3);
}

function barycentricCoordinates(ptx, pty, x1, y1, x2, y2, x3, y3)
{
    var a1 = area(ptx, pty, x2, y2, x3, y3);
    var a2 = area(ptx, pty, x3, y3, x1, y1);
    var a3 = area(ptx, pty, x1, y1, x2, y2);
    var s = a1+a2+a3;
    return [a1/s, a2/s, a3/s];
}

function frac(x) {return x - Math.floor(x);}
function clamp(x, low, high) { return x < low ? low : (x > high ? high : x); }

function smoothstep(t1, t2, x) {
  x = clamp((x - t1) / (t2 - t1), 0.0, 1.0); 
  return x * x * (3 - 2 * x);
}

function render(delta_t) {
    var viewMatrix = camera.getViewMatrix();
    var fov = degreeToRad(45.);
    var aspect = width/height;
    var near = 0.1;
    var far = 100.0;
    var projectionMatrix = m4.perspective(fov, aspect, near, far);
    var mvp = m4.multiply(projectionMatrix, viewMatrix);

    var pixels = imageData.data;

    // clear color
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var offset = i*width*4 + j*4;
            pixels[offset + 0] = 0;
            pixels[offset + 1] = 0;
            pixels[offset + 2] = 0;
            pixels[offset + 3] = 255;
        }
    }

    var num_triangle = positions.length / 3;
    for (var k = 0; k < num_triangle; k++) {
        var p0 = positions[k*3 + 0];
        var p1 = positions[k*3 + 1];
        var p2 = positions[k*3 + 2];
        var ndc0 = m4.transformVector(mvp, [p0[0], p0[1], p0[2], 1.0]);
        var ndc1 = m4.transformVector(mvp, [p1[0], p1[1], p1[2], 1.0]);
        var ndc2 = m4.transformVector(mvp, [p2[0], p2[1], p2[2], 1.0]);
        var u0 = ndc0[0] / ndc0[3], v0 = ndc0[1] / ndc0[3];
        var u1 = ndc1[0] / ndc1[3], v1 = ndc1[1] / ndc1[3];
        var u2 = ndc2[0] / ndc2[3], v2 = ndc2[1] / ndc2[3];

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                var u = (j+0.5)/width * 2.0-1.0, v = (i+0.5)/height* 2.0-1.0;
                var offset = i*width*4 + j*4;
                var in_triangle = pointInTriangle(u, v, u0, v0, u1, v1, u2, v2);
                if (!in_triangle) continue; 
                var bary = barycentricCoordinates(u, v, u0, v0, u1, v1, u2, v2);
                var s = 1;
                if (useCorrection) {
                    bary[0] /= ndc0[3];
                    bary[1] /= ndc1[3];
                    bary[2] /= ndc2[3];
                    s = bary[0]+bary[1]+bary[2];
                }
                var xx = (p0[0]*bary[0] + p1[0]*bary[1] + p2[0]*bary[2])/s;
                var yy = (p0[1]*bary[0] + p1[1]*bary[1] + p2[1]*bary[2])/s;
                var r=0,g=0,b=0;
                var c1 = smoothstep(0.45, 0.5, Math.abs(frac(xx*8) - 0.5)), c2 = smoothstep(0.45, 0.5, Math.abs(frac(yy*8) - 0.5));
                var c = Math.max(c1, c2);
                r = g = b = Math.pow(1-c, 0.454545);

                pixels[offset + 0] = 255*r;
                pixels[offset + 1] = 255*g;
                pixels[offset + 2] = 255*b;
                pixels[offset + 3] = 255;
            }
        }
        // end draw each triangle
    }
    
    ctx.putImageData(imageData, 0,0);
}

var last_time = null;

function frameLoop() {
    current_time = Date.now();
    var delta_t = 1./30.;
    if (last_time != null) {
        delta_t = (current_time - last_time)/1000.0;
    }
    logicUpdate(delta_t);
    render(delta_t);
    postLogicUpdate(delta_t);
    last_time = current_time;
    window.requestAnimationFrame(frameLoop);
}

initScene();
frameLoop();
