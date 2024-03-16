function degreeToRad(degree) { return degree*Math.PI/180.0; }

function getSourceSync(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return (req.status == 200) ? req.responseText : null;
};

async function getSourceAsync(url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.onload = function () {
            var status = xhr.status;
            if (status == 200) {
                resolve(xhr.responseText);
            } else {
                reject(status);
            }
        };
        xhr.send();
    });
}

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
        this.yaw = 180;
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
        // event.preventDefault();
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
const gl = canvas.getContext("webgl");

// globals
const minTess = 1;
const maxTess = 20;
var tessellation = 8;
var skycubeBufferInfo = null;
var skyProgramInfo = null;
var camera = null;
var cameraControl = null;
var worldMats = null;
var invWorldMats = null;
var posBuffer = [];     // 4 vert around per patch
var colorBuffers = [];   // 4 components per vertex, i.e. rgba
var indexBuffer = [];
var progressiveRadiosity = [];
const maxIter = 21;
var selectedIter = maxIter - 1;

var modelBufferInfo = null;
var colorProgramInfo = null;

var current_time = null;

// call bakeRadiosity when scene or tessellation changed
// compute posBuffer, colorBuffer and indexBuffer
function bakeRadiosity() {
    posBuffer = [];
    indexBuffer = [];
    colorBuffers = [];

    var boxVerts = [
        [0,0,0],  
        [0,1,0],  
        [0,0,1],  
        [0,1,1],  
        [1,0,0],  
        [1,1,0],  
        [1,0,1],  
        [1,1,1],
    ];
    var boxIndices = [
        [0,1,3],
        [0,3,2],
        [2,3,7],
        [2,7,6],
        [6,7,5],
        [6,5,4],
        [4,5,1],
        [4,1,0],
        [7,3,1],
        [7,1,5],
    ];
    var patchCenter = [];
    var patchColor = [];
    var patchNormal = [];
    var patchArea = [];
    var patchRadiosity = [];
    var patchEmissive = [];
    var patchActorId = [];
    var patchFaceId = [];

    for (var actorId = 0; actorId < 4; actorId++) {
        const worldMat = worldMats[actorId];
        var flipNormal = false;
        if (actorId == 2) {
            flipNormal = true;
        }

        for (var faceId = 0; faceId < 5; faceId++) {
            var color = [1, 1, 1, 1];
            var emissive = [0,0,0];
            if (actorId == 2) {
                if (faceId == 0) {
                    color = [0.0, 1.0, 0.0, 1.0];
                } else if (faceId == 2) {
                    color = [1.0, 0.0, 0.0, 1.0];
                } else {
                    color = [1, 1, 1, 1];
                }
            } else if (actorId == 3) {
                color = [0, 0, 0, 1];
                emissive = [20,20,20];
                flipNormal = true;
                if (faceId != 4) continue;
            }

            const idxs = boxIndices[faceId*2];
            const i0 = idxs[0], i1 = idxs[1], i2 = idxs[2];
            const p0 = m4.transformPoint(worldMat, boxVerts[i0]);
            const p1 = m4.transformPoint(worldMat, boxVerts[i1]);
            const p2 = m4.transformPoint(worldMat, boxVerts[i2]);
            const du = m4.subtractVectors(p0, p1), dv = m4.subtractVectors(p2, p1);
            const area = (m4.length(du) * m4.length(dv))/(tessellation*tessellation);
            var normal = m4.normalize(m4.cross(du, dv));
            if (flipNormal) {
                normal = m4.scaleVector(normal, -1);
            }
            
            for (var i = 0; i < tessellation; i++) {
                for (var j = 0; j < tessellation; j++) {
                    var u = (j + 0.5) / tessellation;
                    var v = (i + 0.5) / tessellation;
                    var center = m4.addVectors( m4.addVectors(p1, m4.scaleVector(du, u)), m4.scaleVector(dv, v));
                    patchCenter.push(center);
                    patchColor.push(color);
                    patchNormal.push(normal);
                    patchRadiosity.push([0,0,0]);
                    patchActorId.push(actorId);
                    patchFaceId.push(faceId);
                    patchEmissive.push(emissive);
                    patchArea.push(area);

                    var u0 = j / tessellation, u1 = (j + 1) / tessellation;
                    var v0 = i / tessellation, v1 = (i + 1) / tessellation;
                    var vert00 = m4.addVectors( m4.addVectors(p1, m4.scaleVector(du, u0)), m4.scaleVector(dv, v0));
                    var vert01 = m4.addVectors( m4.addVectors(p1, m4.scaleVector(du, u0)), m4.scaleVector(dv, v1));
                    var vert10 = m4.addVectors( m4.addVectors(p1, m4.scaleVector(du, u1)), m4.scaleVector(dv, v0));
                    var vert11 = m4.addVectors( m4.addVectors(p1, m4.scaleVector(du, u1)), m4.scaleVector(dv, v1));
                    var indexBase = posBuffer.length;
                    posBuffer.push(vert00);
                    posBuffer.push(vert01);
                    posBuffer.push(vert10);
                    posBuffer.push(vert11);

                    indexBuffer.push(indexBase + 0);
                    indexBuffer.push(indexBase + 1);
                    indexBuffer.push(indexBase + 3);
                    indexBuffer.push(indexBase + 0);
                    indexBuffer.push(indexBase + 3);
                    indexBuffer.push(indexBase + 2);
                }
            }
        }
    }

    var visbility = (p1, p2) => {
        // test for tall & short block
        for (var blockId = 0; blockId < 2; blockId++) {
            var tmin = 0.0, tmax = Number.POSITIVE_INFINITY;
            const invWorldMat = invWorldMats[blockId];
            const localP1 = m4.transformPoint(invWorldMat, p1), localP2 = m4.transformPoint(invWorldMat, p2);
            const dir = m4.subtractVectors(localP2, localP1);
            const invDir = [1./dir[0], 1./dir[1], 1./dir[2]];
            const origin = m4.addVectors(localP1, m4.scaleVector(dir, 1e-3));   // shift origin along the ray direction
            for (var d = 0; d < 3; d++) {
                var t1 = (0 - origin[d]) * invDir[d];
                var t2 = (1 - origin[d]) * invDir[d];

                tmin = Math.max(tmin, Math.min(t1, t2));
                tmax = Math.min(tmax, Math.max(t1, t2));
            }

            if (tmin < tmax) return 0;

        }
        return 1;
    };

    const patchNum = patchCenter.length;
    var F = new Array(patchNum);
    for (var i = 0; i < patchNum; i++) {
        F[i] = new Array(patchNum);
        for (var j = 0; j < patchNum; j++) {
            F[i][j] = 0;
        }
    }

    for (var i = 0; i < patchNum; i++) {
        for (var j = 0; j < patchNum; j++) {
            if (i == j) {
                F[i][j] = 0;
            } else if (patchActorId[i] == patchActorId[j] && patchFaceId[i] == patchFaceId[j]) {
                F[i][j] = 0;
            } else {
                const pA = patchCenter[i], pB = patchCenter[j];
                const nA = patchNormal[i], nB = patchNormal[j];
                const areaB = patchArea[j];
                const AtoB = m4.subtractVectors(pB, pA);
                const AtoBUnit = m4.normalize(AtoB);
                const r2 = m4.dot(AtoB, AtoB) + 1e-2;
                const c1 = m4.dot(AtoBUnit, nA), c2 = -1*m4.dot(AtoBUnit, nB);
                var f = 0;
                if (c1 > 0 && c2 > 0) {
                    var vis = visbility(pA, pB);
                    f = vis * c1 * c2 * areaB / r2 / Math.PI;
                } else {
                    f = 0;
                }
                F[i][j] = f;
            }
        }
    }
    // 
    for (var iter = 0; iter < maxIter; iter++) {
        var B = new Array(patchNum);
        for (var i = 0; i < patchNum; i++) {
            var sum = [0.0,0.0,0.0];
            for (var j = 0; j < patchNum; j++) {
                sum[0] += patchRadiosity[j][0] * F[i][j];
                sum[1] += patchRadiosity[j][1] * F[i][j];
                sum[2] += patchRadiosity[j][2] * F[i][j];

            }
            sum[0] = patchEmissive[i][0] + sum[0]*patchColor[i][0];
            sum[1] = patchEmissive[i][1] + sum[1]*patchColor[i][1];
            sum[2] = patchEmissive[i][2] + sum[2]*patchColor[i][2];
            B[i] = sum;
            
        }
        patchRadiosity = B;
        var colorBuffer = [];
        for (var i = 0; i < patchNum; i++) {
            colorBuffer[i*4 + 0] = [patchRadiosity[i][0], patchRadiosity[i][1], patchRadiosity[i][2], 1.0];
            colorBuffer[i*4 + 1] = [patchRadiosity[i][0], patchRadiosity[i][1], patchRadiosity[i][2], 1.0];
            colorBuffer[i*4 + 2] = [patchRadiosity[i][0], patchRadiosity[i][1], patchRadiosity[i][2], 1.0];
            colorBuffer[i*4 + 3] = [patchRadiosity[i][0], patchRadiosity[i][1], patchRadiosity[i][2], 1.0];
        }
        colorBuffers[iter] = colorBuffer;
    }
}

function switchIteration() {
    modelBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: posBuffer.map(a => [...a]).flat(),  
        color: colorBuffers[selectedIter].map(a => [...a]).flat(),
        indices: indexBuffer,
    });
}

async function initScene() {
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1.0);

    skycubeBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
        position: [
            -1,  1,  1,  
             1,  1,  1,  
             1, -1,  1,  
            -1, -1,  1, 
             1,  1, -1,  
            -1,  1, -1,  
            -1, -1, -1,  
             1, -1, -1, 
        ],  
        indices: [0,1,2,2,3,0,1,4,7,7,2,1,4,5,6,6,7,4,5,0,3,3,6,5,5,4,1,1,0,5,3,2,7,7,6,3],
    });

    let color_vertex_shader = await getSourceAsync('./color-vertex-shader.glsl');
    let color_fragment_shader = await getSourceAsync('./color-fragment-shader.glsl');
    let sky_vertex_shader = await getSourceAsync('./sky-vertex-shader.glsl');
    let sky_fragment_shader = await getSourceAsync('./sky-fragment-shader.glsl');

    colorProgramInfo = webglUtils.createProgramInfo(gl, [color_vertex_shader, color_fragment_shader]);
    skyProgramInfo = webglUtils.createProgramInfo(gl, [sky_vertex_shader, sky_fragment_shader]);

    camera = new Camera();
    camera.position = [3,3,-10];

    cameraControl = new UECameraControl(camera);
    cameraControl.registerEventHandlers(window);

    // mats
    // tall 1.5824460983276367, 0, -0.4907958209514618, 0, 0, 3.312696933746338, 0, 0, 0.4907958209514618, 0, 1.5824460983276367, 0, 2.651874303817749, 0, 2.963514804840088, 1
    // short 1.588279128074646, 0, 0.48266923427581787, 0, -0, 1.659999966621399, 0, 0, -0.48266923427581787, -0, 1.588279128074646, 0, 1.2968487739562988, 0, 0.6551977396011353, 1
    // wall 5.569371223449707, 0, 0, 0, 0, -0.000020457517166505568, 5.569371223449707, 0, 0, -5.569371223449707, -0.000020457517166505568, 0, 0, 5.569371223449707, 0, 1
    // light 1.6299999952316284, 0, 0, 0, 0, 0.009999999776482582, 0, 0, 0, 0, 1.6299999952316284, 0, 1.940000057220459, 5.541600227355957, 1.940000057220459, 1
    worldMats = [
        [1.5824460983276367, 0, -0.4907958209514618, 0, 0, 3.312696933746338, 0, 0, 0.4907958209514618, 0, 1.5824460983276367, 0, 2.651874303817749, 0, 2.963514804840088, 1],
        [1.588279128074646, 0, 0.48266923427581787, 0, -0, 1.659999966621399, 0, 0, -0.48266923427581787, -0, 1.588279128074646, 0, 1.2968487739562988, 0, 0.6551977396011353, 1],
        [5.569371223449707, 0, 0, 0, 0, -0.000020457517166505568, 5.569371223449707, 0, 0, -5.569371223449707, -0.000020457517166505568, 0, 0, 5.569371223449707, 0, 1],
        [1.6299999952316284, 0, 0, 0, 0, 0.009999999776482582, 0, 0, 0, 0, 1.6299999952316284, 0, 1.940000057220459, 5.541600227355957, 1.940000057220459, 1]
    ];
    invWorldMats = worldMats.map((x) => Array.from(m4.inverse(x)));

    bakeRadiosity();
    switchIteration();
}

function logicUpdate(delta_t) {
    cameraControl.update(delta_t);
}

function postLogicUpdate(delta_t) {}

function render(delta_t) {
    var viewMatrix = camera.getViewMatrix();
    var fov = degreeToRad(45.);
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 100.0;
    var projectionMatrix = m4.perspective(fov, aspect, near, far)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    

    // sky
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgramInfo.program);
    webglUtils.setUniforms(skyProgramInfo, {
        u_view: viewMatrix,
        u_projection: projectionMatrix,
    });
    webglUtils.setBuffersAndAttributes(gl, skyProgramInfo, skycubeBufferInfo);
    webglUtils.drawBufferInfo(gl, skycubeBufferInfo);
    gl.enable(gl.DEPTH_TEST);

    // model
    gl.disable(gl.CULL_FACE);
    gl.useProgram(colorProgramInfo.program);
    webglUtils.setUniforms(colorProgramInfo, {
        u_view: viewMatrix,
        u_projection: projectionMatrix,
    });
    webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, modelBufferInfo);
    webglUtils.drawBufferInfo(gl, modelBufferInfo);
    // gl.disable(gl.CULL_FACE);
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

// initScene();
// frameLoop();
import { GUI } from './lil-gui.js';

function setupGui() {
    
    const container = document.getElementById('gui-container');
    const gui = new GUI( { 
        container: container, 
        width:150 
    } );

    const params = {
        tessellation: tessellation - 1,
        light_bounces: selectedIter,
    };

    {
        let options = Array.from({ length: maxTess - minTess + 1 }, (_, i) => (i + minTess));
        gui.add( params, 'tessellation', options ).name('tessellation:  ').onChange( value => {
            if (value < 10 || window.confirm("It may take long time")) 
            {
                tessellation = value;
                bakeRadiosity();
                switchIteration();   
            }
        });
    }
    {
        let options = Array.from({ length: maxIter }, (_, i) => i);
        gui.add( params, 'light_bounces', options ).name('light bounces: ').onChange( value => {
            selectedIter = value;
            switchIteration();
        });

    }
    gui.domElement.style.fontFamily='var(--font-family-mono)';
    container.style = `width:${gui.domElement.clientWidth}px;position:relative;transform:translate(${canvas.width/2-gui.domElement.clientWidth/2-5}px,  -${canvas.height}px);`;
}

(async function() {
    await initScene();
    setupGui();
    frameLoop();
  })();

