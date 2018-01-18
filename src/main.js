import "./css/normalize.min.css";
import "./css/layout.css";
import "./css/socialicons.css"

import * as fp from "lodash/fp"
import * as THREE from "three";
import consts from "./consts";
import {
    innerEarth,
    earthMap,
    earthBuffer,
    outerEarth,
    universe,
    createRings,
    spike,
} from "./meshes"

import {
    deviceSettings,
    cacheImages,
    colorMix,
    interpolation
} from "./util";
import TrackballControls from "./util/TrackballControls";

import State from "./util/state"

let {
    innerWidth: WIDTH,
    innerHeight: HEIGHT
} = window, {
    scene,

    camera,
    cameraTarget,
    globeMaxZoom,
    globeMinZoom,
    targetCameraZ,

    renderer,

    rotationObject,
    earthObject,
    toRAD,

    mouse,
    mouse: {
        isMouseDown,
        mouseXOnMouseDown,
        mouseYOnMouseDown,
        targetRotationX,
        targetRotationY,
        targetRotationXOnMouseDown,
        targetRotationYOnMouseDown
    }

} = consts,
container = document.getElementById("interactive"), trackballControls,
    state = new State();


init();

document.body.appendChild(state.dom);
window.addEventListener('resize', onWindowResize, false);
document.getElementById("interactive").addEventListener('mousewheel', onMouseWheel, false);
document.getElementById("interactive").addEventListener('mousedown', onMouseDown, false);
document.getElementById("interactive").addEventListener('mousemove', onMouseMove, false);
document.getElementById("interactive").addEventListener('mouseup', onMouseUp, false);
document.getElementById("interactive").addEventListener('mouseleave', onMouseLeave, false);
async function init() {
    let cacheF = cacheImages();
    let imgs = await cacheF();

    let _initStage = fp.flow(setScene, setCamera, setRender, setLights, animate);

    _initStage();

    let earthRotation = setEarthObject();
     earthRotation.add(innerEarth());
    earthRotation.add(earthMap(imgs[3]));
    earthRotation.add(earthBuffer(imgs[2]));
    earthRotation.add(spike());

    await scene.add(universe(imgs[5]))
    await scene.add(createRings());
    
    await scene.add(earthRotation)
    await scene.add(outerEarth(imgs[1]))

}

function setScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 0, 500);
    console.log(scene)
}

function setCamera() {
    camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 1, 2000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 1000;
    camera.rotation.x = 0;
    camera.rotation.y = 0;
    camera.rotation.z = 0;

    //trackballControls = new TrackballControls(camera)
}

function setRender() {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);
}

function setLights() {
    let colorBase = new THREE.Color(new THREE.Color(consts.colorPrimary));
    let {
        lights: {
            lightShieldIntensity,
            lightShieldDistance,
            lightShieldDecay
        }
    } = consts;

    let lightShield1 = new THREE.PointLight(colorBase,
        lightShieldIntensity, lightShieldDistance, lightShieldDecay);
    lightShield1.position.x = -50;
    lightShield1.position.y = 150;
    lightShield1.position.z = 75;
    lightShield1.name = 'lightShield1';
    scene.add(lightShield1);

    let lightShield2 = new THREE.PointLight(colorBase,
        lightShieldIntensity, lightShieldDistance, lightShieldDecay);
    lightShield2.position.x = 100;
    lightShield2.position.y = 50;
    lightShield2.position.z = 50;
    lightShield2.name = 'lightShield2';
    scene.add(lightShield2);

    let lightShield3 = new THREE.PointLight(colorBase,
        lightShieldIntensity, lightShieldDistance, lightShieldDecay);
    lightShield3.position.x = 0;
    lightShield3.position.y = -300;
    lightShield3.position.z = 50;
    lightShield3.name = 'lightShield3';
    scene.add(lightShield3);
}

function setEarthObject() {
    rotationObject = new THREE.Group();
    rotationObject.name = 'rotationObject';
    rotationObject.rotation.x = targetRotationX;
    rotationObject.rotation.y = targetRotationY;

    earthObject = new THREE.Group();
    earthObject.name = 'earthObject';
    earthObject.rotation.y = -90 * toRAD;


    rotationObject.add(earthObject);

    return rotationObject

}

function addAxis() {
    scene.add(new THREE.AxesHelper(600))
}

function animate() {
    requestAnimationFrame(animate);
    render();

}

function render() {
    renderer.render(scene, camera);
    //trackballControls.update();
    state.update()

    if (targetCameraZ < globeMaxZoom) targetCameraZ = globeMaxZoom;
    if (targetCameraZ > globeMinZoom) targetCameraZ = globeMinZoom;

    camera.position.z = interpolation(camera.position.z, targetCameraZ, .05);


    if (targetRotationX > 75 * toRAD) targetRotationX = 75 * toRAD;
    if (targetRotationX < -75 * toRAD) targetRotationX = -75 * toRAD;

    if (scene.getObjectByName("rotationObject")) {
        rotationObject.rotation.x = interpolation(rotationObject.rotation.x, targetRotationX, .1);
        rotationObject.rotation.y = interpolation(rotationObject.rotation.y, targetRotationY, .1);
    }


    if (isMouseDown) return;

    //targetRotationY += 0.002


}

function onWindowResize() {
    let {
        innerWidth: width,
        innerHeight: height
    } = window

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

function onMouseWheel(event) {
    event.preventDefault();
    targetCameraZ -= event.wheelDeltaY * 0.05;
}

function onMouseDown(event) {
    event.preventDefault();
    isMouseDown = true;

    mouseXOnMouseDown = event.clientX - WIDTH / 2;
    mouseYOnMouseDown = event.clientY - HEIGHT / 2;

    targetRotationXOnMouseDown = targetRotationX;
    targetRotationYOnMouseDown = targetRotationY;
}

function onMouseMove(event) {
    if (!isMouseDown) return

    let mouseX = event.clientX - WIDTH / 2
    let mouseY = event.clientY - HEIGHT / 2;

    targetRotationX = targetRotationXOnMouseDown + (mouseY - mouseYOnMouseDown) * .0025;
    targetRotationY = targetRotationYOnMouseDown + (mouseX - mouseXOnMouseDown) * .0025;


}

function onMouseUp(event) {
    event.preventDefault();
    isMouseDown = false;
}

function onMouseLeave(event) {
    event.preventDefault();
    if (isMouseDown) {
        isMouseDown = false;
    }
}