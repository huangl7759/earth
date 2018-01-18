window.consts = {

    scene: null,


    camera: null,
    cameraTarget: "auto",

    globeMaxZoom: 90,
    globeMinZoom: 300,
    targetCameraZ: 230,

    renderer: null,

    rotationObject: null,
    earthObject: null,

    colorPrimary: "#33CCFF",
    colorDarken: "#000000",
    globeRadius: 65,
    toRAD: Math.PI / 180,

    mouse: {
        isMouseDown: false,
        isMouseMoved: false,

        mouseXOnMouseDown: 0,
        mouseYOnMouseDown: 0,

        targetRotationX: .45,
        targetRotationY: 0,
        targetRotationXOnMouseDown: 0,
        targetRotationYOnMouseDown: 0
    },

    lights: {
        lightShieldIntensity: 1.25,
        lightShieldDistance: 400,
        lightShieldDecay: 2.0,
    },
    stars:{
        maxDistance:400,
        minDistance:100,
        number:500,
        size:2,
    }
}

export default consts