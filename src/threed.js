if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var deviceSettings = {
    isWebGL: false,
    isAndroid: null,
    isEarlyIE: null,
    isIE: null,
    isIEMobile: null,
    isiPod: null,
    isiPhone: null,
    isiPad: null,
    isiOS: null,
    isMobile: null,
    isTablet: null,
    isWinSafari: null,
    isMacSafari: null
    };

function setupDeviceSettings() {
    var ua = navigator.userAgent.toLowerCase();
    deviceSettings.isAndroid = ua.indexOf("android") > -1;
    //deviceSettings.isEarlyIE = (jQuery.browser.msie == true && Number(jQuery.browser.version) <= 8) ? true : false;
    //deviceSettings.isIE = jQuery.browser.msie == true;
    deviceSettings.isiPod = navigator.userAgent.match(/iPod/i) !== null;
    deviceSettings.isiPhone = navigator.userAgent.match(/iPhone/i) !== null;
    deviceSettings.isiPad = navigator.userAgent.match(/iPad/i) !== null;
    deviceSettings.isiOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? true : false);
    deviceSettings.isIEMobile = navigator.userAgent.match(/iemobile/i) !== null;
    //determine if this is a mobile browser:
    var p = navigator.platform.toLowerCase();
    if (deviceSettings.isIEMobile || deviceSettings.isAndroid || deviceSettings.isiPad || p === 'ipad' || p === 'iphone' || p === 'ipod' || p === 'android' || p === 'palm' || p === 'windows phone' || p === 'blackberry' || p === 'linux armv7l') {
        deviceSettings.isMobile = true;
        $('body').addClass('isMobile');
    } else {
        $('body').addClass('isDesktop');
    }

    if ( Detector.webgl ) {
        deviceSettings.isWebGL = true;
    }
    if (deviceSettings.isAndroid || deviceSettings.isIEMobile) deviceSettings.isWebGL = false;
}

var container, camera, scene, renderer, stats, statsCreated, i, x, y, b;

var mouse = new THREE.Vector2(), mouseX = 0, mouseY = 0,
    mouseXOnMouseDown = 0, mouseYOnMouseDown = 0,
    clientMouseX = 0, clientMouseY = 0, initMouseX,
    openingCameraZ = 1000, //400,
    targetCameraZ = 250,
    windowHalfX = window.innerWidth / 2, windowHalfY = window.innerHeight / 2,
    toRAD = Math.PI/180, radianLoop = 6.28319,	
    openingRotationX = 0.45,
    targetRotationX = 0.45,
    targetRotationXOnMouseDown = 0.45,
    openingRotationY = 65 * toRAD,
    targetRotationY = 65 * toRAD,
    targetRotationYOnMouseDown = 90 * toRAD,
    lastTouchX, lastTouchY,
    isMouseDown = false, isMouseMoved = false, isGlobeRotated = false, isGlobeEventsEnabled = false;

var globeRaycaster = new THREE.Raycaster(), intersects,  intersection = null, isParticleHit = false, isMediaHit = false;
    globeRaycaster.params.Points.threshold = 0.4;

var colorPrimary_Base = "#33CCFF"; 
var colorSecondary_Base = "#FF1313"; //#FF0000
var colorPrimary = colorPrimary_Base;
var colorSecondary = colorSecondary_Base;
var colorDarken = "#000000";
var colorBrighten = "#FFFFFF";
var colorBase 	= new THREE.Color(colorPrimary),
    colorBase50 = new THREE.Color(shadeBlend(0.50, colorPrimary, colorDarken)),
    colorBase75 = new THREE.Color(shadeBlend(0.75, colorPrimary, colorDarken)),
    colorBase85 = new THREE.Color(shadeBlend(0.85, colorPrimary, colorDarken)),
    colorHighlight 	= new THREE.Color(colorSecondary);

// CREATE THE WEBGL CONTAINER ////////////////////////////////////////
function initWebgl() {
    setupDeviceSettings();
    
    container = document.getElementById("interactive");
    
    var width  = window.innerWidth, height = window.innerHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 0, 400 );
    
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = openingCameraZ;
    camera.rotation.x = 0;
    camera.rotation.y = 0;
    camera.rotation.z = 0;
    
    var functionArr =  [
        { fn: createGroup, 			vars: [stepComplete] },
        { fn: createLights, 		vars: [stepComplete] },
        { fn: createUniverse, 		vars: [stepComplete] },
        { fn: createGlobe, 			vars: [stepComplete] },
        { fn: createDots, 			vars: [stepComplete] },
        { fn: createMedia, 			vars: [stepComplete] },
        { fn: createArcsSnake, 		vars: [stepComplete] },
        { fn: createArcsRocket, 	vars: [stepComplete] },
        { fn: createArcsAll, 		vars: [stepComplete] },
        { fn: createRings, 			vars: [stepComplete] },
        { fn: createSpikes, 		vars: [stepComplete] },
        { fn: createRingPulse, 		vars: [stepComplete] },
        { fn: createRain, 			vars: [stepComplete] },
        { fn: createMinimapBg, 		vars: [stepComplete] },
        { fn: createGlitch, 		vars: [stepComplete] },
        { fn: createPreloader, 		vars: [stepComplete] },
        //{ fn: createGyroscope, 		vars: [stepComplete] },
        { fn: createStars, 			vars: [stepComplete] },
        { fn: initAudio, 			vars: null }
    ];

    arrayExecuter.execute(functionArr);
    
    renderer = new THREE.WebGLRenderer({ 
        antialias : true, 
        alpha: false
    });
    renderer.setSize(width, height);
    renderer.setClearColor (0x000000, 1);
    //renderer.sortObjects = false;
    
    container.appendChild( renderer.domElement );
    /*
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.left = '0px';
    stats.domElement.id = "fps";
    container.appendChild( stats.domElement );
    statsCreated = true;
    */
    animate();
}


// PRELOADER ////////////////////////////////////////
var preloaderAnimationIn,
    preloaderAnimationInComplete = false,
    preloaderAnimationOut,
    preloaderArray = [],
    preloaderComplete = false,
    preloaderLoaded = 0,
    preloaderTotal = 0,
    preloaderSplitText,
    preloaderSplitTextWordTotal,
    isIntroDone = false,
    introAnimation;

function createPreloader(callbackFn) {
    TweenMax.set( "#bookNumber", { transformPerspective: 600, perspective: 300, transformStyle: "preserve-3d" });
    TweenMax.set( "#bookQuote", { transformPerspective: 600, perspective: 300, transformStyle: "preserve-3d" });
    TweenMax.set( "#preloaderBar", { scaleX: 0, autoAlpha: 0, transformOrigin: 'center center' });
    TweenMax.set( "#preloaderBarInner", { scaleX: 0, autoAlpha: 0, transformOrigin: 'center center' });
    TweenMax.set( ".close line", { drawSVG: "50% 50%", stroke: "#FFFFFF", autoAlpha: 0 } );
    TweenMax.set( ".close circle", { drawSVG: "50% 50%", stroke: "#FFFFFF", autoAlpha: 0 } );
    
    changeTagline();
    preloaderSplitText = new SplitText("#bookQuote", {type:"words"});
    preloaderSplitTextWordTotal = preloaderSplitText.words.length;
    
    preloaderAnimationIn =  new TimelineMax({ paused: true, onComplete: function () {
        preloaderAnimationInComplete = true;
        startPreloader();
    }} );
    
    
    if ($('.book').length) {
        /* 
        $('.book').each(function(index) {
            for (var i=0;i<3;i++) {
                //var tempClass = ('page' + (i+1));
                var tempClass = ('page' + (3-i));
                $(this).find('.cover').before('<img src="img/book_page.jpg" class="page ' + tempClass + '" />');
            }
        });
        */
        TweenMax.set( ".overlay", { autoAlpha: 0 });
        TweenMax.set( ".cover, .overlay, .page", { transformPerspective: 800, perspective: 300, transformStyle: "preserve-3d", transformOrigin: "left center" });
    }
    
    
    preloaderAnimationIn.fromTo( "#intro_book", 2, { autoAlpha: 0 }, { autoAlpha: 1, display: 'block', ease: Linear.easeNone }, 1 );
    preloaderAnimationIn.fromTo( "#intro_book", 2, { scale: 0.8 }, { scale: 1, ease: Power4.easeOut }, 1 );
    
    preloaderAnimationIn.fromTo( "#intro_book .overlay", 2, { autoAlpha: 0 }, { autoAlpha: 1, immediateRender: false, ease: Linear.easeNone }, 1.5 );
    preloaderAnimationIn.fromTo( "#intro_book .cover, #intro_book .overlay", 2, { rotationY: 0 }, { rotationY: -40, immediateRender: false, ease: Expo.easeOut }, 1.5 );
    preloaderAnimationIn.fromTo( "#intro_book .page1", 2, { rotationY: 0 }, { rotationY: -34, immediateRender: false, ease: Expo.easeOut }, 1.5 );
    preloaderAnimationIn.fromTo( "#intro_book .page2", 2, { rotationY: 0 }, { rotationY: -27, immediateRender: false, ease: Expo.easeOut }, 1.5 );
    preloaderAnimationIn.fromTo( "#intro_book .page3", 2, { rotationY: 0 }, { rotationY: -15, immediateRender: false, ease: Expo.easeOut }, 1.5 );
    
    preloaderAnimationIn.to( "#intro_book .overlay", 2, { autoAlpha: 0, immediateRender: false }, 3.5 );
    preloaderAnimationIn.to( "#intro_book .overlay", 2, { rotationY: 0, immediateRender: false }, 3.5 );
    preloaderAnimationIn.to( "#intro_book .cover", 2, { rotationY: 0, immediateRender: false }, 3.5 );
    preloaderAnimationIn.to( "#intro_book .page", 2, { rotationY: 0, immediateRender: false }, 3.5 );
    
    preloaderAnimationIn.fromTo( "#intro_book", 2, { autoAlpha: 1 }, { autoAlpha: 0, immediateRender: false, ease: Linear.easeNone }, 3.5 );
    preloaderAnimationIn.fromTo( "#intro_book", 2, { scale: 1 }, { scale: 0.8, immediateRender: false, ease: Power4.easeIn }, 3.5 );
    
    
    preloaderAnimationIn.from( "#bookNumber", 1, { z: generateRandomNumber(-200,-50), autoAlpha: 0, ease: Linear.easeNone }, 6 );
    preloaderAnimationIn.fromTo( "#preloaderInner", 1, { autoAlpha: 0 }, { autoAlpha: 1, ease: Expo.easeOut }, 6 );
    for(var i = 0; i < preloaderSplitTextWordTotal; i++){
        preloaderAnimationIn.from(preloaderSplitText.words[i], 2, { z: generateRandomNumber(-200,-50), rotationX: 0, autoAlpha: 0, ease: Expo.easeOut }, 6 + Math.random() * 1 );
    }
    
    //preloaderAnimationIn.fromTo( "#bookQuote, #bookNumber", 2, { color: "#485fab" }, { color: "#FFFFFF", ease: Linear.easeNone }, 6 );
    TweenMax.staggerFromTo( "#bookNumber, #bookQuote div", 3, { color: "#FFFFFF" }, { color: "#FFFFFF", delay: 7 }, 0.1 );
    //TweenMax.set( "#bookQuote, #bookNumber", { color: "#485fab" } );
    
    
    preloaderAnimationIn.timeScale(1);
    preloaderAnimationIn.play(0);
    
    if (callbackFn) {
        callbackFn();
    }
}

function startPreloader() {
    preloaderArray.push("img/dot-inverted.png");
    preloaderArray.push("img/earth-glow.jpg");
    preloaderArray.push("img/ring_explosion.jpg");
    preloaderArray.push("img/map.png");
    preloaderArray.push("img/map_inverted.png");
    preloaderArray.push("img/photo.png");
    preloaderArray.push("img/universe.jpg");
    preloaderArray.push("img/hex.jpg");
    preloaderArray.push("img/mapDetails.png");
    preloaderArray.push("img/mapLines.png");
    preloaderArray.push("img/mapCircles.png");
    preloaderArray.push("img/mapExtras1.png");
    preloaderArray.push("img/mapExtras2.png");
    preloaderArray.push("img/mapGradient1.png");
    preloaderArray.push("img/mapGradient2.png");
    
    preloaderTotal = preloaderArray.length;
    for (var i = 0; i < preloaderArray.length; i++) {
        var image = new Image();
        image.src = preloaderArray[i];
        image.onload = function(){
           checkPreloader();
        };
    }
    TweenMax.fromTo( "#preloaderBar", 1, { scaleX: 0, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, ease: Expo.easeOut });
    TweenMax.fromTo( "#preloaderBarInner", 3, { backgroundColor: "#485fab" }, { backgroundColor: "#33CCFF", ease: Linear.easeNone } );
    TweenMax.staggerTo( "#bookQuote div, #bookNumber", 2, { color: "#33CCFF", immediateRender: false, ease: Linear.easeNone }, 0.1 );
}

function checkPreloader() {
    preloaderLoaded++;
    var tempPercentage = (preloaderLoaded/preloaderTotal);
    if (preloaderLoaded === preloaderTotal) {
        preloaderComplete = true;
        if( preloaderAnimationInComplete) {
            //initExperience();
        }
    }
    
    TweenMax.to( "#preloaderBarInner", 1, { scaleX: tempPercentage, autoAlpha: 1, transformOrigin: 'center center', ease: Expo.easeOut, onComplete: function () {
        if(preloaderComplete) {
            finishPreloader();
            initExperience();
        }
    }});
}

function finishPreloader() {
    preloaderAnimationOut =  new TimelineMax({ paused: true, onComplete: function () {
        playIntro();
    }} );
    preloaderAnimationOut.to( "#preloaderBar", 1, { scaleX: 0, autoAlpha: 0, ease: Expo.easeIn, transformOrigin: 'center center' }, 0);
    preloaderAnimationOut.to( "#preloaderInner", 2, { autoAlpha: 0 });
    
    for(var i = 0; i < preloaderSplitTextWordTotal; i++){
        preloaderAnimationOut.to(preloaderSplitText.words[i], 2, { z: generateRandomNumber(-200,-50), autoAlpha: 0, immediateRender: false, ease: Expo.easeIn }, Math.random() * 1 );
    }
    
    
    preloaderAnimationOut.timeScale(1);
    preloaderAnimationOut.play(0);
}

var arrayExecuter = new ArrayExecuter();
var stepComplete = arrayExecuter.stepComplete_instant.bind(arrayExecuter);

function initExperience() {
    document.getElementById("interactive").addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.getElementById("interactive").addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById("interactive").addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.getElementById("interactive").addEventListener( 'mouseleave', onDocumentMouseLeave, false );
    
    document.getElementById("interactive").addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.getElementById("interactive").addEventListener( 'touchmove', onDocumentTouchMove, false );
    document.getElementById("interactive").addEventListener( 'touchend', onDocumentTouchEnd, false );
    
    document.getElementById("interactive").addEventListener('mousewheel', onMouseWheel, false);
    
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    });
    
    window.addEventListener( 'resize', onWindowResize, false );
    onWindowResize();
    
    initButtons();
}

function playIntro() {
    isGlobeRotated = true;
    isGlobeEventsEnabled = true;
    
    TweenMax.set("#ui svg", { rotation: -90, transformOrigin:"center center"});
    TweenMax.set( "#bracket-left", { drawSVG: "20% 30%" } );
    TweenMax.set( "#bracket-right", { drawSVG: "70% 80%"} );
    
    introAnimation =  new TimelineMax({ paused: true, force3D: true,
        onComplete:function(){
            //setArcAnimation("snake");
            isIntroDone = true;
            //changeStat();
        }
    });
    introAnimation.fromTo( "#preloader", 2, { autoAlpha: 1 }, { autoAlpha: 0, ease: Linear.easeNone }, 0 );
    ////introAnimation.fromTo( "#bracket-left", 1, { autoAlpha: 0 }, { autoAlpha: 0.5, ease: Linear.easeNone }, 1.25 );
    ////introAnimation.fromTo( "#bracket-right", 1, { autoAlpha: 0 }, { autoAlpha: 0.5, ease: Linear.easeNone }, 1.25 );
    ////introAnimation.fromTo( "#bracket-left", 2, { drawSVG: "25% 25%" }, { drawSVG: "20% 30%", ease: Expo.easeInOut }, 1.25 );
    ////introAnimation.fromTo( "#bracket-right", 2, { drawSVG: "75% 75%" }, { drawSVG: "70% 80%", ease: Expo.easeInOut }, 1.25 );
    introAnimation.staggerFromTo( "#header .animate", 2, { y: -75 }, { y: 0, ease: Expo.easeInOut }, -0.1, 1 );
    introAnimation.fromTo( "#nav-left a", 2, { x: 100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: Expo.easeInOut }, 0.1, 2 );
    introAnimation.fromTo( "#nav-right a", 2, { x: -100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: Expo.easeInOut }, 0.1, 2 );
    
    introAnimation.staggerFromTo( "#arcMode .optionitem", 2, { x: -150, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: Expo.easeOut }, -0.1, 2 );
    introAnimation.staggerFromTo( "#colorMode .optionitem", 2, { x: 150, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: Expo.easeOut }, 0.1, 2 );
    introAnimation.fromTo( ".category", 2, { autoAlpha: 0 }, { autoAlpha: 1 }, 2 );
    //introAnimation.staggerFromTo( "#arcMode .optionitem", 2, { autoAlpha: 0 }, { autoAlpha: 1, ease: Linear.easeNone }, 0.1, 2 );
    //introAnimation.staggerFromTo( "#colorMode .optionitem", 2, { autoAlpha: 0 }, { autoAlpha: 1, ease: Linear.easeNone }, 0.1, 2 );
    
    //introAnimation.fromTo( "#minimapBackground, #minimap", 3, { y: 200 }, { y: 0, ease: Expo.easeInOut }, 1 );
    //introAnimation.staggerFromTo( "#minimap .animate_stroke", 2, { drawSVG: "50% 50%" }, { drawSVG: "0% 100%", ease: Quint.easeInOut }, 0.1, 1 );
    //introAnimation.staggerFromTo( "#minimap .animate_stroke", 1, { attr:{ "fill-opacity": 0 } }, { attr: {"fill-opacity": 1 } , ease: Linear.easeNone }, 0.1, 3 );
    //introAnimation.fromTo( "#minimapBackground", 3, { autoAlpha: 0 }, { autoAlpha: 1 }, 1 );
    
    introAnimation.timeScale(1);
    introAnimation.play();
    
    
    
    var minimapAnimation2 =  new TimelineMax({ paused: true, delay: 2 });
    
    minimapAnimation2.fromTo( minimapSpiral, 1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, ease: Linear.easeNone}, 0 );
    minimapAnimation2.fromTo( minimapDetails, 1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, ease: Linear.easeNone}, 0 );
    minimapAnimation2.fromTo( minimapLines, 1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, ease: Linear.easeNone}, 0 );
    
    minimapAnimation2.to( minimapDetails, 1,  { pixi:{ tint: colorPrimary} }, 3 );
    minimapAnimation2.fromTo( minimapLines, 2, { pixi:{ tint: 0xFFFFFF }}, { pixi:{ tint: colorPrimary }, ease: Linear.easeNone }, 0 );
    minimapAnimation2.fromTo( minimapMaskGradient, 2, { pixi:{ scaleX: 0 }}, { pixi:{ scaleX: 1.25 }, ease: Expo.easeOut }, 0 );
    minimapAnimation2.fromTo( minimapSpiral, 2, { pixi:{ rotation: 90 }}, { pixi:{ rotation: 450 }, ease: Expo.easeOut}, 0 );
    minimapAnimation2.fromTo( minimapSpiral, 0.1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, immediateRender: false, ease: Linear.easeNone }, 0 );
    minimapAnimation2.fromTo( minimapSpiral, 0.75, { pixi:{ alpha: 1 }}, { pixi:{ alpha: 0 }, immediateRender: false, ease: Linear.easeNone }, 0.2 );
    minimapAnimation2.fromTo( minimapMaskGradient, 2, { pixi:{ alpha: 1 }}, { pixi:{ alpha: 0 }, ease: Linear.easeNone }, 0.5 );
    minimapAnimation2.fromTo( minimapBlipsGroup, 0.65, { pixi:{ scale: 0 }}, { pixi:{ scale: 1 }, ease: Expo.easeOut}, 0 );
    minimapAnimation2.fromTo( minimapBlipArray, 0.75, { pixi:{ alpha: 1 }}, { pixi:{ alpha: 0 }, ease: Linear.easeNone}, 0.5 );
    minimapAnimation2.fromTo( minimapSpikesGroup, 0.75, { pixi:{ scale: 0 }}, { pixi:{ scale: 1 }, ease: Expo.easeOut}, 0 );
    minimapAnimation2.fromTo( minimapXArray, 0.75, { pixi:{ scaleY: 1 }}, { pixi:{ scaleY: 0 }, ease: Circ.easeInOut}, 0.1 );
    minimapAnimation2.fromTo( minimapExtras1, 3, { pixi:{ rotation: 0 }}, { pixi:{ rotation: -360 }, ease: Expo.easeOut}, 0 );
    minimapAnimation2.fromTo( minimapExtras1, 0.1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, ease: Linear.easeNone }, 0 );
    minimapAnimation2.fromTo( minimapExtras1, 1, { pixi:{ alpha: 1, tint: 0xFFFFFF }}, { pixi:{ alpha: 0, tint: colorPrimary }, immediateRender: false, ease: Linear.easeNone }, 0.2 );

    minimapAnimation2.fromTo( minimapExtras2, 1.5, { pixi:{ scale: 0.50 }}, { pixi:{ scale: 1.1 }, ease: Expo.easeOut}, 0 );
    minimapAnimation2.fromTo( minimapExtras2, 0.1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 0.5 }, ease: Linear.easeNone }, 0 );
    minimapAnimation2.fromTo( minimapExtras2, 1, { pixi:{ alpha: 0.5, tint: 0xFFFFFF }}, { pixi:{ alpha: 0, tint: colorPrimary }, immediateRender: false, ease: Linear.easeNone }, 0.2 );

    minimapAnimation2.fromTo( minimapXArray, 1, { pixi:{ tint: 0xFFFFFF }}, { pixi:{ tint: colorPrimary }, ease: Linear.easeNone }, 0 );
    minimapAnimation2.fromTo( minimapBlipArray, 1, { pixi:{ tint: 0xFFFFFF }}, { pixi:{ tint: colorPrimary }, ease: Linear.easeNone }, 0 );

    minimapAnimation2.timeScale(1.5);
    minimapAnimation2.play();
    
    
    var descriptionAnimation =  new TimelineMax({ paused: true });
    descriptionAnimation.fromTo( "#tutorial", 1, { autoAlpha: 0 }, { autoAlpha: 1, immediateRender: false, ease: Linear.easeNone }, 3 );
    descriptionAnimation.fromTo( "#tutorial", 2, { scrambleText:{ text: " " } }, { scrambleText:{ text: "THESE ARE BOOK LOCATIONS", chars:"0123456789!@#$%^&*()" }, ease: Expo.easeInOut }, 3 );
    descriptionAnimation.fromTo( "#tutorial", 1, { autoAlpha: 0 }, { autoAlpha: 1, immediateRender: false, ease: Linear.easeNone }, 6 );
    descriptionAnimation.fromTo( "#tutorial", 2, { scrambleText:{ text: " " } }, { scrambleText:{ text: "ZOOM IN TO SEE LOCATIONS WITH PHOTOS", chars:"0123456789!@#$%^&*()" }, ease: Expo.easeInOut }, 6 );
    descriptionAnimation.fromTo( "#tutorial", 1, { autoAlpha: 0 }, { autoAlpha: 1, immediateRender: false, ease: Linear.easeNone }, 9 );
    descriptionAnimation.fromTo( "#tutorial", 2, { scrambleText:{ text: " " } }, { scrambleText:{ text: "PLAY WITH THE OPTIONS BELOW", chars:"0123456789!@#$%^&*()" }, ease: Expo.easeInOut }, 9 );
    descriptionAnimation.fromTo( "#tutorial", 1, { autoAlpha: 1 }, { autoAlpha: 0, immediateRender: false, ease: Linear.easeNone }, 12 );
    descriptionAnimation.timeScale(1);
    descriptionAnimation.play();
    
    setArcAnimation("snake");
    showGlobe();
}



// CONTAINER OBJECTS ////////////////////////////////////////
var rotationObject,
    earthObject;
function createGroup(callbackFn) {
    rotationObject  = new THREE.Group();
    rotationObject.name = 'rotationObject';
    rotationObject.rotation.x = openingRotationX;
    rotationObject.rotation.y = openingRotationY;
    scene.add(rotationObject);
    
    earthObject = new THREE.Group();
    earthObject.name = 'earthObject';
    earthObject.rotation.y = -90 * toRAD;
    rotationObject.add(earthObject);
    
    if (callbackFn) {
        callbackFn();
    }
}



// LIGHTS  ////////////////////////////////////////
var lightShield1, 
    lightShield2, 
    lightShield3,
    lightShieldIntensity = 1.25,
    lightShieldDistance = 400,
    lightShieldDecay = 2.0,
    lightsCreated = false;
function createLights(callbackFn) {
    lightShield1 = new THREE.PointLight( colorBase, lightShieldIntensity, lightShieldDistance, lightShieldDecay );
    lightShield1.position.x = -50;
    lightShield1.position.y = 150;
    lightShield1.position.z = 75;
    lightShield1.name = 'lightShield1';
    scene.add( lightShield1 );
    
    lightShield2 = new THREE.PointLight( colorBase, lightShieldIntensity, lightShieldDistance, lightShieldDecay );
    lightShield2.position.x = 100;
    lightShield2.position.y = 50;
    lightShield2.position.z = 50;
    lightShield2.name = 'lightShield2';
    scene.add( lightShield2 );
    
    lightShield3 = new THREE.PointLight( colorBase, lightShieldIntensity, lightShieldDistance, lightShieldDecay );
    lightShield3.position.x = 0;
    lightShield3.position.y = -300;
    lightShield3.position.z = 50;
    lightShield3.name = 'lightShield3';
    scene.add( lightShield3 );
    
    lightsCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}



// TILT OBJECT ////////////////////////////////////////
var ringsObject,
    ringsOuterMaterial,
    ringsInnerMaterial,
    ringsCreated = false;
function createRings(callbackFn) {
    ringsObject = new THREE.Group();
    ringsObject.name = 'ringsObject';
    scene.add( ringsObject );
    
    var ringLargeGeometry = new THREE.RingGeometry( 200, 195, 128 );
    var ringMediumGeometry = new THREE.RingGeometry( 100, 98, 128 );
    
    ringsOuterMaterial = new THREE.MeshBasicMaterial( { 
        color: colorBase75, //colorBase85,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    });
    ringsInnerMaterial = new THREE.MeshBasicMaterial( { 
        color: colorBase50, //colorBase75,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    });
    
    var ringLargeMesh1 = new THREE.Mesh( ringLargeGeometry, ringsOuterMaterial );
    ringLargeMesh1.rotation.x = 90 * toRAD;
    var ringLargeMesh2 = ringLargeMesh1.clone();
    ringLargeMesh1.position.y = 90;
    ringLargeMesh2.position.y = -90;
    ringsObject.add( ringLargeMesh1 );
    ringsObject.add( ringLargeMesh2 );
    
    var ringMediumMesh1 = new THREE.Mesh( ringMediumGeometry, ringsInnerMaterial );
    ringMediumMesh1.rotation.x = 90 * toRAD;
    var ringMediumMesh2 = ringMediumMesh1.clone();
    ringMediumMesh1.position.y = 100;
    ringMediumMesh2.position.y = -100;
    ringsObject.add( ringMediumMesh1 );
    ringsObject.add( ringMediumMesh2 );
    
    ringsCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderRings() {
    ringsObject.rotation.x = ringsObject.rotation.x += ( targetTiltX - ringsObject.rotation.x ) * 0.25;
    ringsObject.rotation.z = ringsObject.rotation.z -= ( targetTiltY + ringsObject.rotation.z ) * 0.25;
}



// UNIVERSE BACKGROUND ////////////////////////////////////////
var universeBgObject,
    universeBgTexture,
    universeBgMaterial,
    universeBgGeometry,
    universeBgMesh,
    universeCreated = false;
function createUniverse(callbackFn) {
    universeBgTexture = new THREE.TextureLoader().load("img/universe.jpg");
    universeBgTexture.anisotropy = 16;
    universeBgGeometry = new THREE.PlaneGeometry(1500, 750, 1, 1);
    universeBgMaterial = new THREE.MeshBasicMaterial({ 
        map: universeBgTexture,
        blending: THREE.AdditiveBlending,
        color: colorBase,
        transparent: true,
        opacity: 0,
        fog: false,
        side: THREE.DoubleSide,
        depthWrite: false, depthTest: false
    });
    universeBgMesh = new THREE.Mesh( universeBgGeometry, universeBgMaterial );
    universeBgMesh.position.z = -400;
    universeBgMesh.name = 'universeBgMesh';
    scene.add(universeBgMesh);

    universeCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}



// EARTH ////////////////////////////////////////
var globeRadius = 65,
    globeMaxZoom = 90,
    globeMinZoom = 300,
    globeExtraDistance = 0.05,
    globeBufferGeometry,
    globeTexture,
    globeInnerMaterial,
    globeOuterMaterial,
    globeInnerMesh,
    globeOuterMesh,
    globeShieldGeometry,
    globeShieldMaterial,
    globeShieldMesh,
    globeCloud,
    globeCloudVerticesArray = [],
    globeCloudBufferGeometry,
    globeCloudColors,
    globeCloudMaterial,
    globeGlowSize = 200,
    globeGlowTexture,
    globeGlowMaterial,
    globeGlowBufferGeometry,
    globeGlowMesh,
    globeGlowPositionZ = 0,
    globeCreated = false;
function createGlobe(callbackFn) {

    globeBufferGeometry = new THREE.SphereBufferGeometry(globeRadius, 64, 64);
    globeTexture = new THREE.TextureLoader().load("img/map.png");
    //var maxAnisotropy = renderer.getMaxAnisotropy();
    globeTexture.anisotropy = 16;
    
    globeInnerMaterial = new THREE.MeshBasicMaterial({
        map: globeTexture,
        color: colorBase75,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        fog: true,
        depthWrite: false, depthTest: false
    });
    globeInnerMaterial.needsUpdate = true;
    globeInnerMesh = new THREE.Mesh(globeBufferGeometry, globeInnerMaterial);
    earthObject.add(globeInnerMesh);
    
    globeOuterMaterial = new THREE.MeshBasicMaterial({
        map: globeTexture,
        color: colorBase,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        fog: true,
        depthWrite: false, depthTest: false
    });
    globeOuterMaterial.needsUpdate = true;
    globeOuterMesh = new THREE.Mesh(globeBufferGeometry, globeOuterMaterial);
    earthObject.add(globeOuterMesh);
    
    // GLOW REFLECTIONS
    globeShieldMaterial = new THREE.MeshPhongMaterial( {
        color: colorBase75,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
        opacity: 0,
        fog: false,
        depthWrite: false, depthTest: false
        //,shading: THREE.FlatShading
    } );
    globeShieldMesh = new THREE.Mesh( globeBufferGeometry, globeShieldMaterial );
    globeShieldMesh.name = 'globeShieldMesh';
    scene.add( globeShieldMesh );
    
    // MAP PARTICLE FILL
    var img = new Image();
    img.src = "img/map_inverted.png";
    
    img.onload = function(){
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,img.width,img.height);
        
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for(var i=0; i<imageData.data.length; i+=4) {
            var curX = (i / 4) % canvas.width;
            var curY = ((i / 4) - curX) / canvas.width;
            if (((i / 4)) % 2 === 1 && curY % 2 === 1) {
                var color = imageData.data[i];
                if (color === 0) {
                    var x = curX;
                    var y = curY;
                    var lat = (y/(canvas.height/180)-90)/-1;
                    var lng = x/(canvas.width/360)-180;
                    var position = latLongToVector3(lat, lng, globeRadius, -0.1);
                    globeCloudVerticesArray.push(position);
                }
            }
        }
        
        globeCloudBufferGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array(globeCloudVerticesArray.length * 3);
        for (var i = 0; i < globeCloudVerticesArray.length; i++) {
            positions[i * 3] = globeCloudVerticesArray[i].x;
            positions[i * 3 + 1] = globeCloudVerticesArray[i].y;
            positions[i * 3 + 2] = globeCloudVerticesArray[i].z;
        }
        globeCloudBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

        // COLOR CHECKERED
        globeCloudMaterial = new THREE.PointsMaterial( { 
            size: 0.75, 
            fog: true,
            vertexColors: THREE.VertexColors,
            //transparent: true,
            //blending: THREE.AdditiveBlending,
            depthWrite: false//, depthTest: false
        });
        
        var colors = new Float32Array(globeCloudVerticesArray.length * 3);
        var globeCloudColors = [];
        for( var i = 0; i < globeCloudVerticesArray.length; i++ ) {
            var tempPercentage = generateRandomNumber( 80, 90 ) * 0.01;
            var shadedColor = shadeBlend(tempPercentage, colorPrimary_Base, colorDarken);
            globeCloudColors[i] = new THREE.Color(shadedColor);
        }
        for (var i = 0; i < globeCloudVerticesArray.length; i++) {
            colors[i * 3] = globeCloudColors[i].r;
            colors[i * 3 + 1] = globeCloudColors[i].g;
            colors[i * 3 + 2] = globeCloudColors[i].b;
        }
        globeCloudBufferGeometry.addAttribute( 'color', new THREE.BufferAttribute(colors, 3));
        globeCloudBufferGeometry.colorsNeedUpdate = true;
        
        globeCloud = new THREE.Points( globeCloudBufferGeometry, globeCloudMaterial );
        globeCloud.sortParticles = true;
        globeCloud.name = 'globeCloud';
        earthObject.add( globeCloud );
    };
     
    // EARTH GLOW
    globeGlowSize = 200;
    globeGlowTexture = new THREE.TextureLoader().load("img/earth-glow.jpg");
    globeGlowTexture.anisotropy = 2;
    
    //globeGlowTexture.anisotropy = maxAnisotropy;
    globeGlowTexture.wrapS = globeGlowTexture.wrapT = THREE.RepeatWrapping;
    globeGlowTexture.magFilter = THREE.NearestFilter;
    globeGlowTexture.minFilter = THREE.NearestMipMapNearestFilter;
    
    globeGlowBufferGeometry = new THREE.PlaneBufferGeometry(globeGlowSize, globeGlowSize, 1, 1);
    globeGlowMaterial = new THREE.MeshBasicMaterial({ 
        map: globeGlowTexture,
        color: colorBase,
        transparent: true,
        opacity: 0,
        fog: false,
        blending: THREE.AdditiveBlending,
        
        depthWrite: false//, depthTest: false
    });
    globeGlowMesh = new THREE.Mesh( globeGlowBufferGeometry, globeGlowMaterial );
    globeGlowMesh.name = 'globeGlowMesh';
    scene.add(globeGlowMesh);
    
    globeCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderGlobe() {
    if (isGlobeEventsEnabled) {
        // ZOOM LEVEL
        if (targetCameraZ < globeMaxZoom) targetCameraZ = globeMaxZoom;
        if (targetCameraZ > globeMinZoom) targetCameraZ = globeMinZoom;
        camera.position.z = camera.position.z += ( targetCameraZ - camera.position.z ) * 0.01;

        // MOVE DAT GLOW MESH
        var cameraThresholdZ = 200;
        var tempCameraZ = camera.position.z;
        if (tempCameraZ < cameraThresholdZ && tempCameraZ > globeMaxZoom) {
            var tempDifference = cameraThresholdZ - globeMaxZoom;
            var tempPosition = (cameraThresholdZ - tempCameraZ) / tempDifference;
            globeGlowPositionZ = 0 + (tempPosition * 22);
        } else {
            globeGlowPositionZ = 0;
        }
        globeCloud.sortParticles = true;
        globeGlowMesh.position.set( 0, 0, globeGlowPositionZ );
    }
}

function showGlobe() {
    TweenMax.fromTo( universeBgMaterial, 4, { opacity: 0 }, { opacity: 1, delay: 1, ease: Linear.easeNone } );
    TweenMax.fromTo( globeShieldMaterial, 3, { opacity: 0 }, { opacity: 0.65, delay: 1, ease: Linear.easeNone } );
    TweenMax.fromTo( globeGlowMaterial, 3, { opacity: 0 }, { opacity: 1, delay: 1, ease: Linear.easeNone } );
    TweenMax.fromTo( starsZoomObject.position, 6, { z: 0 }, { z: 325, ease: Circ.easeInOut,
        onComplete:function(){
            starsZoomObject.visible = false;
        }
    });
}



// MAP DOTS ////////////////////////////////////////
var dotObject,
    dotTexture,
    dotMaterial,
    dotSpritesArray = [],
    dotDetailsArray = [],
    
    dotHoverTexture,
    dotHoverMaterial,
    dotSpritesHoverArray = [],
    
    dotSpikesVerticesArray = [],
    dotSpikesBufferGeometry,
    dotSpikesMaterial,
    dotSpikesMesh,
    
    dotSpikeHoverGeometry,
    dotSpikeHoverMaterial,
    dotSpikeHover,
    
    dotSpikesCloudVerticesArray = [],
    
    dotsCreated = false;

function createDots(callbackFn) {
    dotObject = new THREE.Group();
    dotObject.name = 'dotObject';
    earthObject.add( dotObject );
    
    dotTexture = new THREE.TextureLoader().load("img/dot-inverted.png");
    dotMaterial = new THREE.MeshBasicMaterial( {
        map: dotTexture,
        color: colorHighlight,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    });
    
    for ( i = 0; i < dataMap.length; i ++ ) {
        var bookType = dataMap[i][1];
        var x = dataMap[i][2];
        var y = dataMap[i][3];
        
        var dotGeometry = new THREE.PlaneBufferGeometry( 1, 1, 1 );

        var dotSprite = new THREE.Mesh( dotGeometry, dotMaterial );
        dotSprite.userData = {id: i };
        
         //var randomExtra = (Math.floor(Math.random() * 100) + 1) * 0.0001;
         var randomExtra = 0.1;
        if (bookType === 2) randomExtra = randomExtra + 0.05;
        var dotPosition = latLongToVector3(x, y, globeRadius, globeExtraDistance + randomExtra );			
        dotSprite.position.set( dotPosition.x, dotPosition.y, dotPosition.z );
        dotSprite.lookAt(new THREE.Vector3(0, 0, 0));
        
        var dotSize = 2;
        if (bookType === 2) dotSize = 3;
        dotSprite.scale.set( dotSize, dotSize, dotSize );
        
        dotDetailsArray.push({
            position: new THREE.Vector3(dotSprite.position.x, dotSprite.position.y, dotSprite.position.z),
            type: bookType
        });
        
        dotSpritesArray.push( dotSprite );
        dotObject.add( dotSprite );
        
        // ADD THE HOVERS
        var dotHoverMaterial = new THREE.MeshBasicMaterial( {
            map: dotTexture,
            color: colorHighlight,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            opacity: 0,
            depthWrite: false//, depthTest: false
        });
        var dotHoverSprite = new THREE.Mesh( dotGeometry, dotHoverMaterial );
        var dotPosition = latLongToVector3(x, y, globeRadius, globeExtraDistance + randomExtra );			
        dotHoverSprite.position.set( dotPosition.x, dotPosition.y, dotPosition.z );
        dotHoverSprite.lookAt(new THREE.Vector3(0, 0, 0));
        dotHoverSprite.visible = false;
        
        dotSpritesHoverArray.push( dotHoverSprite );
        dotObject.add( dotHoverSprite );
    }
    
    // DOT SPIKES		
    for ( i = 0; i < dotDetailsArray.length; i ++ ) {
        var vertex1 = new THREE.Vector3();
        vertex1.x = dotSpritesArray[i].position.x;
        vertex1.y = dotSpritesArray[i].position.y;
        vertex1.z = dotSpritesArray[i].position.z;
        var vertex2 = vertex1.clone();
        var tempScalar = (Math.random() * 4) * 0.01;
        
        if ( dotDetailsArray[i].type === 2 ) {
            vertex2.multiplyScalar( 1.12 );
        }
        if ( dotDetailsArray[i].type === 1 ) {
            vertex2.multiplyScalar( 1.02 + tempScalar );
        }
        if ( dotDetailsArray[i].type === 0 ) {
            vertex2.multiplyScalar( 1.02 + tempScalar );
        }
        dotSpikesVerticesArray.push( vertex1 );
        dotSpikesVerticesArray.push( vertex2 );
        dotSpikesCloudVerticesArray.push( vertex2 );
    }
    
    var positions = new Float32Array( dotSpikesVerticesArray.length * 3 );
    for (var i = 0; i < dotSpikesVerticesArray.length; i++) {
        positions[i * 3] = dotSpikesVerticesArray[i].x;
        positions[i * 3 + 1] = dotSpikesVerticesArray[i].y;
        positions[i * 3 + 2] = dotSpikesVerticesArray[i].z;
    }
    
    dotSpikesMaterial = new THREE.LineBasicMaterial( { 
        linewidth: 1,
        color: colorHighlight, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        fog: true,
        depthWrite: false
    });
    
    dotSpikesBufferGeometry = new THREE.BufferGeometry();
    dotSpikesBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    dotSpikesMesh = new THREE.LineSegments( dotSpikesBufferGeometry, dotSpikesMaterial );
    dotObject.add( dotSpikesMesh );
    
    // DOT SPIKE EXTRAS
    var tempArray = [];
    for ( i = 0; i < dotSpikesCloudVerticesArray.length; i ++ ) {
        var vertex1 = new THREE.Vector3();
        vertex1 = dotSpikesCloudVerticesArray[i];
        var vertex2 = vertex1.clone();
        vertex2.multiplyScalar( 1.0025 );
        tempArray.push( vertex1 );
        tempArray.push( vertex2 );
    }
    
    var positions = new Float32Array( tempArray.length * 3 );
    for (var i = 0; i < tempArray.length; i++) {
        positions[i * 3] = tempArray[i].x;
        positions[i * 3 + 1] = tempArray[i].y;
        positions[i * 3 + 2] = tempArray[i].z;
    }
    
    dotSpikesExtraMaterial = new THREE.LineBasicMaterial( { 
        linewidth: 1,
        color: 0xFFFFFF, //colorBase, //new THREE.Color(shadeBlend(0.5, colorSecondary_Base, colorBrighten)),
        transparent: true,
        blending: THREE.AdditiveBlending,
        //opacity: 0.5,
        fog: true,
        depthWrite: false
    });
    
    dotSpikesExtraBufferGeometry = new THREE.BufferGeometry();
    dotSpikesExtraBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    dotSpikesExtraMesh = new THREE.LineSegments( dotSpikesExtraBufferGeometry, dotSpikesExtraMaterial );
    dotObject.add( dotSpikesExtraMesh );
    
    dotsCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderDots() {
    // RESIZE DOTS
    var cameraThresholdZ = 200;
    var tempCameraZ = camera.position.z;
    var dotScale = 0;
    if (tempCameraZ < cameraThresholdZ && tempCameraZ > globeMaxZoom) {
        var tempDifference = cameraThresholdZ - globeMaxZoom;
        var tempScale = (cameraThresholdZ - tempCameraZ) / tempDifference;
        dotScale = tempScale * 1.25;
    }
    for ( i = 0; i < dotDetailsArray.length; i ++ ) {
        var baseScale = 2;
        if (dotDetailsArray[i].type === 2) baseScale = 3;
        dotSpritesArray[i].scale.set( baseScale - dotScale, baseScale - dotScale, 1 );
    }
}




// MEDIA ICONS DOTS ////////////////////////////////////////
var mediaObject,
    mediaTexture,
    mediaMaterial,
    mediaSpritesArray = [],
    mediaDetailsArray = [],
    mediaCloud,
    mediaVerticesArray = [],
    mediaCreated = false;
function createMedia(callbackFn) {
    mediaObject = new THREE.Group();
    mediaObject.name = 'mediaObject';
    earthObject.add( mediaObject );
    
    // POINT CLOUD GEOMETRY
    for ( i = 0; i < dataMedia.length; i ++ ) {
        var mediaType = dataMedia[i][0];
        var x = dataMedia[i][2];
        var y = dataMedia[i][3];
        
         var randomExtra = (Math.floor(Math.random() * 20) + 1) * 0.1;
        
        var mediaPosition = latLongToVector3(x, y, globeRadius, globeExtraDistance + 8 + randomExtra );	
        mediaVerticesArray.push( mediaPosition );
        
        mediaDetailsArray.push({
            position: new THREE.Vector3(mediaPosition.x, mediaPosition.y, mediaPosition.z),
            type: mediaType
        });
    }
    
    mediaTexture = new THREE.TextureLoader().load("img/photo.png");
    mediaMaterial = new THREE.PointsMaterial( { 
        map: mediaTexture,
        size: 0, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        color: 0xFFFFFF,
        depthWrite: false//, depthTest: false
    });
    mediaMaterial.needsUpdate = true;
    
    var positions = new Float32Array(mediaVerticesArray.length * 3);
    for (var i = 0; i < mediaVerticesArray.length; i++) {
        positions[i * 3] = mediaVerticesArray[i].x;
        positions[i * 3 + 1] = mediaVerticesArray[i].y;
        positions[i * 3 + 2] = mediaVerticesArray[i].z;
    }
    
    mediaBufferGeometry = new THREE.BufferGeometry();
    mediaBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    
    mediaCloud = new THREE.Points( mediaBufferGeometry, mediaMaterial );
    mediaCloud.sortParticles = true;
    mediaObject.add( mediaCloud );
    
    mediaCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderMedia() {
    // RESIZE DOTS
    var cameraThresholdZ = 200;
    var tempCameraZ = camera.position.z;
    var dotScale = 0;
    if (tempCameraZ < cameraThresholdZ && tempCameraZ > globeMaxZoom) {
        var tempDifference = cameraThresholdZ - globeMaxZoom;
        var tempScale = (cameraThresholdZ - tempCameraZ) / tempDifference;
        mediaMaterial.size = 1.25 * tempScale;
        mediaMaterial.needsUpdate = true;
    }
}





// STARS ////////////////////////////////////////
var starsObject1,
    starsObject2,
    starsObjectZoom,
    starsCenter = new THREE.Vector3(0, 0, 0),
    starsCloud1,
    starsCloud2,
    starsTotal = 500,
    starsMaxDistance = 400, //globeMinZoom + 100,
    starsMinDistance = 100, //globeMinZoom + 25,
    starsVerticesArray = [],
    starsMaterial,
    starsSize = 1,
    
    starsZoomObject,
    starZoomTexture,
    starsZoomTotal = 150,
    starsZoomMaxDistance = 200,
    starsZoomBuffer = 0, //globeMinZoom + 10,
    starsZoomVerticesArray = [],
    starsZoomMaterial,
    starsZoomBufferGeometry,

    starsCreated = false;

function createStars(callbackFn) {
    starsObject1 = new THREE.Group();
    starsObject1.name = 'starsObject1';
    scene.add( starsObject1 );
    
    starsObject2 = new THREE.Group();
    starsObject2.name = 'starsObject2';
    scene.add( starsObject2 );
    
    // POINT CLOUD GEOMETRY
    for ( i = 0; i < starsTotal; i ++ ) {
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * starsMaxDistance - starsMaxDistance/2;
        vertex.y = Math.random() * 150 - 150/2;
        vertex.z = Math.random() * starsMaxDistance - starsMaxDistance/2;
        var tempDifference = checkDistance(starsCenter, vertex);
        var tempBuffer = starsMinDistance;
        if (tempDifference < tempBuffer) {
            if (vertex.x < tempBuffer) vertex.x = tempBuffer;
            if (vertex.y < tempBuffer) vertex.y = tempBuffer;
            if (vertex.z < tempBuffer) vertex.z = tempBuffer;
        }
        starsVerticesArray.push( vertex );
    }

    starsMaterial = new THREE.PointsMaterial({
        //map: starTexture, 
        //transparent: true,
        //blending: THREE.AdditiveBlending,
        size: starsSize,
        sizeAttenuation: false,
        color: colorBase,
        fog: true
    });
    starsMaterial.needsUpdate = true;
    
    var positions = new Float32Array(starsVerticesArray.length * 3);
    for (var i = 0; i < starsVerticesArray.length; i++) {
        positions[i * 3] = starsVerticesArray[i].x;
        positions[i * 3 + 1] = starsVerticesArray[i].y;
        positions[i * 3 + 2] = starsVerticesArray[i].z;
    }
    
    starsBufferGeometry = new THREE.BufferGeometry();
    starsBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    
    starsCloud1 = new THREE.Points( starsBufferGeometry, starsMaterial );
    starsCloud1.sortParticles = true;
    starsObject1.add( starsCloud1 );
    
    starsCloud2 = new THREE.Points( starsBufferGeometry, starsMaterial );
    starsCloud2.sortParticles = true;
    starsObject2.add( starsCloud2 );
    starsObject2.rotation.x = 180 * toRAD;
    
    
    
    // STAR ZOOM FIELD
    starsZoomObject = new THREE.Group();
    starsZoomObject.name = 'starsObjectZoom';
    scene.add( starsZoomObject );
    
    //starZoomTexture = new THREE.TextureLoader().load("img/dot-inverted.png");
    starZoomTexture = new THREE.TextureLoader().load("img/star.jpg");
    
    // POINT CLOUD GEOMETRY
    for ( i = 0; i < starsZoomTotal; i ++ ) {
        var vertex = new THREE.Vector3();
        vertex.x = Math.random() * starsZoomMaxDistance - starsZoomMaxDistance/2;
        vertex.y = Math.random() * starsZoomMaxDistance - starsZoomMaxDistance/2;
        vertex.z = starsZoomBuffer + Math.random() * 500; //starsZoomMaxDistance - starsZoomMaxDistance/2;
        starsZoomVerticesArray.push( vertex );
    }

    starsZoomMaterial = new THREE.PointsMaterial({
        map: starZoomTexture, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        size: 5,
        color: colorBase,
        fog: true
    });
    
    var positions = new Float32Array(starsZoomVerticesArray.length * 3);
    for (var i = 0; i < starsZoomVerticesArray.length; i++) {
        positions[i * 3] = starsZoomVerticesArray[i].x;
        positions[i * 3 + 1] = starsZoomVerticesArray[i].y;
        positions[i * 3 + 2] = starsZoomVerticesArray[i].z;
    }
    
    starsZoomBufferGeometry = new THREE.BufferGeometry();
    starsZoomBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    
    starsZoomCloud = new THREE.Points( starsZoomBufferGeometry, starsZoomMaterial );
    starsZoomCloud.sortParticles = true;
    starsZoomObject.add( starsZoomCloud );
    
    starsCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderStars() {
    starsObject1.rotation.y += 0.00025;
    starsObject2.rotation.y += 0.00025;
}




// ARCS ////////////////////////////////////////
var lineBufferSpeed = 0.025;
var lineBufferDivisions = 25;
var snakeBufferSpeed = (lineBufferSpeed * lineBufferDivisions) * 3;

var arcRocketObject,
    arcRocketDetailsArray = [],
    arcRocketVerticesArray = [],
    arcRocketBufferGeometry,
    arcRocketShaderUniforms,
    arcRocketShaderMaterial,
    arcRocketMesh,
    arcRocketAnimation,
    arcRocketCreated = false;
function createArcsRocket(callbackFn) {
    arcRocketObject = new THREE.Group();
    arcRocketObject.name = 'arcsRocket';
    
    for ( i = 0; i < dataMap.length-1; i ++ ) {
        var p1 = latLongToVector3(dataMap[0][2], dataMap[0][3], globeRadius, globeExtraDistance);
        var p4 = latLongToVector3(dataMap[i+1][2], dataMap[i+1][3], globeRadius, globeExtraDistance);
    
        var tempArcHeightMid = 1 + (checkDistance(p1,p4) * 0.006);
        var pMid = new THREE.Vector3();
        pMid.addVectors( p1, p4 );
        pMid.normalize().multiplyScalar(globeRadius * tempArcHeightMid);

        var tempArcHeight = 1 + (checkDistance(p1,pMid) * 0.006);
        
        var p2 = new THREE.Vector3();
        p2.addVectors( p1, pMid );
        p2.normalize().multiplyScalar(globeRadius * tempArcHeight);

        var p3 = new THREE.Vector3();
        p3.addVectors( pMid, p4 );
        p3.normalize().multiplyScalar(globeRadius * tempArcHeight);
        
        var curve = new THREE.CubicBezierCurve3( p1, p2, p3, p4 );
        var curveVertices = curve.getPoints( lineBufferDivisions );
        for (var j = 0; j < lineBufferDivisions; j++) {
            arcRocketVerticesArray.push(curveVertices[j]);
            arcRocketDetailsArray.push({
                alpha: 0
            });
            arcRocketVerticesArray.push(curveVertices[j+1]);
            arcRocketDetailsArray.push({
                alpha: 0
            });
        }
    }
    
    // BUFFER VERSION
    arcRocketBufferGeometry = new THREE.BufferGeometry();
    arcRocketShaderUniforms = {
        color:     { value: colorHighlight },
        fogColor:    { type: "c", value: scene.fog.color },
        fogNear:     { type: "f", value: scene.fog.near },
        fogFar:      { type: "f", value: scene.fog.far }
    };
    arcRocketShaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       arcRocketShaderUniforms,
        vertexShader:   document.getElementById( 'line_vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'line_fragmentshader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        fog: true,
        transparent:    true
    });
    
    var positions = new Float32Array(arcRocketVerticesArray.length * 3);
    var alphas = new Float32Array( arcRocketVerticesArray.length );
    
    for (var i = 0; i < arcRocketVerticesArray.length; i++) {
        positions[i * 3] = arcRocketVerticesArray[i].x;
        positions[i * 3 + 1] = arcRocketVerticesArray[i].y;
        positions[i * 3 + 2] = arcRocketVerticesArray[i].z;
        alphas[ i ] = 0; 
    }
    
    arcRocketBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    arcRocketBufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
    arcRocketMesh = new THREE.LineSegments( arcRocketBufferGeometry, arcRocketShaderMaterial );
    arcRocketObject.add( arcRocketMesh );
    arcRocketObject.visible = false;
    arcRocketCreated = true;
    
    // ARC ROCKET ANIMATION
    arcRocketAnimation =  new TimelineMax({ paused: true, repeat: -1,
        onUpdate:function(){
            renderArcsRocket()
        }
    });
    
    arcRocketAnimation.staggerTo( arcRocketDetailsArray, 0.25, { alpha: 0 }, 0.025, 2 );
    arcRocketAnimation.staggerFromTo( arcRocketDetailsArray, 0.25, { alpha: 0 }, { alpha: 1 }, 0.025, 0 );
    arcRocketAnimation.timeScale(2);
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderArcsRocket() {
    if (!arcRocketCreated) return;
    var attributes = arcRocketBufferGeometry.attributes;
    for ( var i = 0; i < arcRocketDetailsArray.length; i ++ ) {
        var pd = arcRocketDetailsArray[i];
        attributes.alpha.array[ i ] = pd.alpha;
    }
    attributes.alpha.needsUpdate = true;
}




var arcSnakeObject,
    arcSnakeDetailsArray = [],
    arcSnakeVerticesArray = [],
    arcSnakeBufferGeometry,
    arcSnakeShaderUniforms,
    arcSnakeShaderMaterial,
    arcSnakeMesh,
    arcSnakeAnimation,
    arcSnakeCreated = false;
function createArcsSnake(callbackFn) {
    arcSnakeObject = new THREE.Group();
    arcSnakeObject.name = 'arcsSnake';
    
    for ( i = 0; i < dataMap.length-1; i ++ ) {
        var p1 = latLongToVector3(dataMap[i][2], dataMap[i][3], globeRadius, globeExtraDistance);
        var p4 = latLongToVector3(dataMap[i+1][2], dataMap[i+1][3], globeRadius, globeExtraDistance);
    
        var tempArcHeightMid = 1 + (checkDistance(p1,p4) * 0.0065);
        var pMid = new THREE.Vector3();
        pMid.addVectors( p1, p4 );
        pMid.normalize().multiplyScalar(globeRadius * tempArcHeightMid);

        var tempArcHeight = 1 + (checkDistance(p1,pMid) * 0.0065);
        var p2 = new THREE.Vector3();
        p2.addVectors( p1, pMid );
        p2.normalize().multiplyScalar(globeRadius * tempArcHeight);

        var p3 = new THREE.Vector3();
        p3.addVectors( pMid, p4 );
        p3.normalize().multiplyScalar(globeRadius * tempArcHeight);
        
        var curve = new THREE.CubicBezierCurve3( p1, p2, p3, p4 );
        var curveVertices = curve.getPoints( lineBufferDivisions );
        for (var j = 0; j < lineBufferDivisions; j++) {
            arcSnakeVerticesArray.push(curveVertices[j]);
            arcSnakeDetailsArray.push({
                alpha: 0
            });
        }
    }
    
    // BUFFER VERSION
    arcSnakeBufferGeometry = new THREE.BufferGeometry();
    arcSnakeShaderUniforms = {
        color:	     { value: colorHighlight },
        fogColor:    { type: "c", value: scene.fog.color },
        fogNear:     { type: "f", value: scene.fog.near },
        fogFar:      { type: "f", value: scene.fog.far }
    };
    arcSnakeShaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       arcSnakeShaderUniforms,
        vertexShader:   document.getElementById( 'line_vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'line_fragmentshader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        fog: true,
        transparent:    true
    });
    
    var positions = new Float32Array(arcSnakeVerticesArray.length * 3);
    var alphas = new Float32Array( arcSnakeVerticesArray.length );
    
    for (var i = 0; i < arcSnakeVerticesArray.length; i++) {
        positions[i * 3] = arcSnakeVerticesArray[i].x;
        positions[i * 3 + 1] = arcSnakeVerticesArray[i].y;
        positions[i * 3 + 2] = arcSnakeVerticesArray[i].z;
        alphas[ i ] = 0; 
    }
    
    arcSnakeBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    arcSnakeBufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
    arcSnakeMesh = new THREE.Line( arcSnakeBufferGeometry, arcSnakeShaderMaterial );
    arcSnakeObject.add( arcSnakeMesh );
    earthObject.add( arcSnakeObject );
    //arcSnakeObject.visible = false;
    arcSnakeCreated = true;
    
    // ARC SNAKE ANIMATION
    arcSnakeAnimation =  new TimelineMax({ paused: true, delay: 2, repeat: -1,
        onUpdate:function(){
            renderArcsSnake();
        }
    });

    for ( i = 0; i < dotSpritesHoverArray.length; i++ ) {
        var tempTarget = dotSpritesHoverArray[i];
        arcSnakeAnimation.fromTo( tempTarget.scale, 1, { x: 2, y: 2 }, { x: 10, y: 10, ease: Expo.easeOut }, (lineBufferDivisions * 0.025) * i);
        arcSnakeAnimation.fromTo( tempTarget.material, 1.5, { opacity: 1 }, { opacity: 0 }, (lineBufferDivisions * 0.025) * i);
        arcSnakeAnimation.fromTo( tempTarget, 1.5, {  }, {
            onStart:function(){
                this.target.visible = true;
            },
            onComplete:function(){
                this.target.visible = false;
            }
        }, (lineBufferDivisions * 0.025) * i);
    }
    
    arcSnakeAnimation.staggerTo( arcSnakeDetailsArray, 0.25, { alpha: 0 }, 0.025, 2 );
    arcSnakeAnimation.staggerFromTo( arcSnakeDetailsArray, 0.25, { alpha: 0 }, { alpha: 1 }, 0.025, 0 );
    //arcSnakeAnimation.timeScale(2);

    if (callbackFn) {
        callbackFn();
    }
}

function renderArcsSnake() {
    if (!arcSnakeCreated) return;
    var attributes = arcSnakeBufferGeometry.attributes;
    for ( var i = 0; i < arcSnakeDetailsArray.length; i++ ) {
        var pd = arcSnakeDetailsArray[i];
        attributes.alpha.array[ i ] = pd.alpha;
    }
    attributes.alpha.needsUpdate = true;
}

var arcAllObject,
    arcAllsVerticesArray = [],
    arcAllBufferGeometry,
    arcAllMaterial,
    arcAllMesh,
    arcAllAnimation,
    arcAllCreated = false;
function createArcsAll(callbackFn) {
    arcAllObject = new THREE.Group();
    arcAllObject.name = 'arcsAll';
    
    for ( i = 0; i < dataMap.length-1; i ++ ) {
        var p1 = latLongToVector3(dataMap[0][2], dataMap[0][3], globeRadius, globeExtraDistance);
        var p4 = latLongToVector3(dataMap[i+1][2], dataMap[i+1][3], globeRadius, globeExtraDistance);

        var tempArcHeightMid = 1 + (checkDistance(p1,p4) * 0.005);
        var pMid = new THREE.Vector3();
        pMid.addVectors( p1, p4 );
        pMid.normalize().multiplyScalar(globeRadius * tempArcHeightMid);

        var tempArcHeight = 1 + (checkDistance(p1,pMid) * 0.005);
        var p2 = new THREE.Vector3();
        p2.addVectors( p1, pMid );
        p2.normalize().multiplyScalar(globeRadius * tempArcHeight);

        var p3 = new THREE.Vector3();
        p3.addVectors( pMid, p4 );
        p3.normalize().multiplyScalar(globeRadius * tempArcHeight);
        
        var curve = new THREE.CubicBezierCurve3( p1, p2, p3, p4 );
        var curveVertices = curve.getPoints( lineBufferDivisions );
        for (var j = 0; j < lineBufferDivisions; j++) {
            arcAllsVerticesArray.push(curveVertices[j]);
            arcAllsVerticesArray.push(curveVertices[j+1]);
        }
    }
    
    arcAllMaterial = new THREE.LineBasicMaterial( { 
        linewidth: 1,
        color : colorHighlight, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        fog: true,
        depthWrite: false//, depthTest: false
    });
    
    var positions = new Float32Array(arcAllsVerticesArray.length * 3);
    for (var i = 0; i < arcAllsVerticesArray.length; i++) {
        positions[i * 3] = arcAllsVerticesArray[i].x;
        positions[i * 3 + 1] = arcAllsVerticesArray[i].y;
        positions[i * 3 + 2] = arcAllsVerticesArray[i].z;
    }
    
    arcAllBufferGeometry = new THREE.BufferGeometry();
    arcAllBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    arcAllMesh = new THREE.LineSegments( arcAllBufferGeometry, arcAllMaterial );
    arcAllObject.add( arcAllMesh );
    arcAllObject.visible = false;

    // ARC ALL ANIMATION
    arcAllAnimation =  new TimelineMax({ paused: true });
    arcAllAnimation.fromTo( arcAllMesh.material, 2, { opacity: 0 }, { opacity: 1 }, 0);
    arcAllAnimation.timeScale(1);
    
    arcAllCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}


// SPIKES ////////////////////////////////////////
var spikesObject,
    spikeRadius = globeRadius + 30,
    spikesVerticesArray = [],
    spikesBufferGeometry,
    spikesMaterial,
    spikesMesh,
    spikesCreated = false;
function createSpikes(callbackFn) {
    spikesObject = new THREE.Group();
    spikesObject.name = 'spikesObject';
    rotationObject.add( spikesObject );
    
    // SPHERE SPIKES
    var sphereSpikeRadius = globeRadius + 40,
        sphereGeometry = new THREE.SphereGeometry( sphereSpikeRadius, 8, 4 );
        //sphereGeometry.rotation.y = 25 * toRAD;
        sphereGeometry.mergeVertices();
    
    for ( i = 0; i < sphereGeometry.vertices.length; i ++ ) {
        var vertex1 = new THREE.Vector3();
        vertex1.x = sphereGeometry.vertices[i].x;
        vertex1.y = sphereGeometry.vertices[i].y;
        vertex1.z = sphereGeometry.vertices[i].z;
        vertex1.normalize();
        vertex1.multiplyScalar( sphereSpikeRadius );
        var vertex2 = vertex1.clone();
        vertex2.multiplyScalar( 1.03 );
        spikesVerticesArray.push( vertex1 );
        spikesVerticesArray.push( vertex2 );
    }
    
    // FLAT SPIKE RING
    var spikeTotal = 400;
    var spikeAngle = 2 * Math.PI / spikeTotal;
    for ( i = 0; i < spikeTotal; i ++ ) {
        var vertex1 = new THREE.Vector3();
        vertex1.x = spikeRadius * Math.cos(spikeAngle * i);
        vertex1.y = 0;
        vertex1.z = spikeRadius * Math.sin(spikeAngle * i);
        vertex1.normalize();
        vertex1.multiplyScalar( spikeRadius );
        var vertex2 = vertex1.clone();
        if (i % 10 === 1) {
            vertex2.multiplyScalar( 1.02 );
        } else {
            vertex2.multiplyScalar( 1.01 );
        }
        spikesVerticesArray.push( vertex1 );
        spikesVerticesArray.push( vertex2 );
    }
    
    var positions = new Float32Array(spikesVerticesArray.length * 3);
    for (var i = 0; i < spikesVerticesArray.length; i++) {
        positions[i * 3] = spikesVerticesArray[i].x;
        positions[i * 3 + 1] = spikesVerticesArray[i].y;
        positions[i * 3 + 2] = spikesVerticesArray[i].z;
    }
    
    spikesMaterial = new THREE.LineBasicMaterial( { 
        linewidth: 1,
        color: colorBase50, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    });
    
    spikesBufferGeometry = new THREE.BufferGeometry();
    spikesBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    spikesMesh = new THREE.LineSegments( spikesBufferGeometry, spikesMaterial );
    spikesObject.add( spikesMesh );

    spikesCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}



// RING PULSE ////////////////////////////////////////
var ringPulseObject,
    ringPulseTotal = 250,
    ringPulseTotalHalf = ringPulseTotal/2,
    ringPulseAngle = 2 * Math.PI / ringPulseTotal,
    ringPulseRadius = globeRadius + 25,
    ringPulseVerticesArray = [],
    ringPulseBufferGeometry,
    ringPulsetShaderUniforms,
    ringPulseShaderMaterial,
    ringPulseMesh,
    ringExplosionSize = 100,
    ringExplosionTexture,
    ringExplosionMaterial,
    ringExplosionBufferGeometry,
    ringExplosionMesh,
    ringPointRadius = globeRadius + 20,
    ringPointTotal = 250,
    ringPointAngle = 2 * Math.PI / ringPointTotal,
    ringPointSize = 0.5,
    ringPointGeometry,
    ringPointMaterial,
    ringPointMesh,
    ringPulseCreated = false;
function createRingPulse(callbackFn) {
    ringPulseObject = new THREE.Group();
    ringPulseObject.name = 'ringPulse';
    
    for ( i = 0; i < ringPulseTotal; i ++ ) {
        var vertex = new THREE.Vector3();
        vertex.x = ringPulseRadius * Math.cos(ringPulseAngle * i);
        vertex.y = 0;
        vertex.z = ringPulseRadius * Math.sin(ringPulseAngle * i);
        vertex.normalize();
        vertex.multiplyScalar( ringPulseRadius );
        ringPulseVerticesArray.push(vertex);
    }
    
    ringPulseBufferGeometry = new THREE.BufferGeometry();
    ringPulseShaderUniforms = {
        color:     { value: colorBase },
        fogColor:    { type: "c", value: scene.fog.color },
        fogNear:     { type: "f", value: scene.fog.near },
        fogFar:      { type: "f", value: scene.fog.far }
    };
    ringPulseShaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       ringPulseShaderUniforms,
        vertexShader:   document.getElementById( 'line_vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'line_fragmentshader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        fog: true,
        transparent:    true
    });
    
    var positions = new Float32Array(ringPulseVerticesArray.length * 3);
    var alphas = new Float32Array( ringPulseVerticesArray.length );
    
    var maxOpacity = 0.5;
    for (var i = 0; i < ringPulseVerticesArray.length; i++) {
        positions[i * 3] = ringPulseVerticesArray[i].x;
        positions[i * 3 + 1] = ringPulseVerticesArray[i].y;
        positions[i * 3 + 2] = ringPulseVerticesArray[i].z;
        
        var tempOpacity = 0;
        var tempHalfOpacity = ringPulseTotalHalf/2;
        if ( i < ringPulseTotalHalf ) {
            if (i < tempHalfOpacity) {
                tempOpacity = (i / tempHalfOpacity) * maxOpacity; // FADE UP
            } else {
                tempOpacity = 1 - ((i / tempHalfOpacity) * maxOpacity); // FADE DOWN
            }
        }
        alphas[ i ] = tempOpacity; 
    }
    
    ringPulseBufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    ringPulseBufferGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
    ringPulseMesh = new THREE.LineLoop( ringPulseBufferGeometry, ringPulseShaderMaterial );
    ringPulseObject.add( ringPulseMesh );
    rotationObject.add( ringPulseObject );
    
    // EARTH EXPLOSION RING
    ringExplosionTexture = new THREE.TextureLoader().load("img/ring_explosion.jpg");
    ringExplosionBufferGeometry = new THREE.PlaneBufferGeometry(ringExplosionSize, ringExplosionSize, 1, 1);
    ringExplosionMaterial = new THREE.MeshBasicMaterial({ 
        map: ringExplosionTexture,
        color: colorBase85,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false//, depthTest: false
    });
    ringExplosionMesh = new THREE.Mesh( ringExplosionBufferGeometry, ringExplosionMaterial );
    ringExplosionMesh.rotation.x = 90 * toRAD;
    ringExplosionMesh.name = 'ringExplosionMesh';
    ringExplosionMesh.visible = false;
    rotationObject.add(ringExplosionMesh);
    
    
    
    // ADD POINT CLOUD RING
    ringPointGeometry = new THREE.Geometry();
    for ( i = 0; i < ringPointTotal; i ++ ) {
        var vertex = new THREE.Vector3();
        vertex.x = ringPointRadius * Math.cos(ringPointAngle * i);
        vertex.y = 0;
        vertex.z = ringPointRadius * Math.sin(ringPointAngle * i);
        ringPointGeometry.vertices.push( vertex );
    }

    ringPointMaterial = new THREE.PointsMaterial( { 
        size: ringPointSize, 
        color: colorBase75, 
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false//, depthTest: false
    });
    ringPointMesh = new THREE.Points( ringPointGeometry, ringPointMaterial );
    ringPointMesh.sortParticles = true;
    rotationObject.add( ringPointMesh );
    
    ringPulseCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderRingPulse() {
    ringPulseObject.rotation.y += 0.025;
}



// GYROSCOPE  ////////////////////////////////////////
var gyroscopeObject,
    gyroscopeGeometry,
    gyroscopeRingSize = globeRadius + 25,
    gyroscopeRingThickness = gyroscopeRingSize - 1,
    gyroscopeMaterial,
    gyroscopeMesh1,
    gyroscopeMesh2,
    gyroscopeMesh3,
    gyroscopeMesh4,
    gyroscopeCreated = false;
function createGyroscope(callbackFn) {
    gyroscopeObject = new THREE.Object3D();
    rotationObject.add( gyroscopeObject );

    gyroscopeGeometry = new THREE.RingGeometry( gyroscopeRingSize, gyroscopeRingThickness, 128 );
    gyroscopeMaterial = new THREE.MeshBasicMaterial( { 
        color: colorHighlight,
        opacity: 0.25,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    });
    gyroscopeMaterial.needsUpdate = true;
    /*
    gyroscopeMesh1 = new THREE.Mesh( gyroscopeGeometry, gyroscopeMaterial );
    gyroscopeMesh2 = new THREE.Mesh( gyroscopeGeometry, gyroscopeMaterial );
    gyroscopeMesh3 = new THREE.Mesh( gyroscopeGeometry, gyroscopeMaterial );
    gyroscopeMesh4 = new THREE.Mesh( gyroscopeGeometry, gyroscopeMaterial );
    */
    gyroscopeMesh1 = new THREE.Mesh( gyroscopeGeometry, new THREE.MeshBasicMaterial( { 
        color: colorBase,
        opacity: 0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    }) );
    gyroscopeMesh2 = new THREE.Mesh( gyroscopeGeometry, new THREE.MeshBasicMaterial( { 
        color: colorBase,
        opacity: 0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    }) );
    gyroscopeMesh3 = new THREE.Mesh( gyroscopeGeometry, new THREE.MeshBasicMaterial( { 
        color: colorBase,
        opacity: 0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    }) );
    gyroscopeMesh4 = new THREE.Mesh( gyroscopeGeometry, new THREE.MeshBasicMaterial( { 
        color: colorBase,
        opacity: 0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        fog: true,
        depthWrite: false//, depthTest: false
    }) );
    
    var gyroscopeObject1 = new THREE.Object3D();
    var gyroscopeObject2 = new THREE.Object3D();
    var gyroscopeObject3 = new THREE.Object3D();
    var gyroscopeObject4 = new THREE.Object3D();
    
    gyroscopeObject1.rotation.x = 90 * toRAD;
    gyroscopeObject2.rotation.x = 90 * toRAD;
    gyroscopeObject3.rotation.x = 90 * toRAD;
    gyroscopeObject4.rotation.x = 90 * toRAD;
    
    gyroscopeObject1.rotation.y = 0 * toRAD;
    gyroscopeObject2.rotation.y = 0 * toRAD;
    gyroscopeObject3.rotation.y = 180 * toRAD;
    gyroscopeObject4.rotation.y = 0 * toRAD;
    
    gyroscopeObject1.rotation.z = 0 * toRAD;
    gyroscopeObject2.rotation.z = 90 * toRAD;
    gyroscopeObject3.rotation.z = 0 * toRAD;
    gyroscopeObject4.rotation.z = 270 * toRAD;
    
    gyroscopeObject1.add( gyroscopeMesh1 );
    gyroscopeObject2.add( gyroscopeMesh2 );
    gyroscopeObject3.add( gyroscopeMesh3 );
    gyroscopeObject4.add( gyroscopeMesh4 );
    
    gyroscopeObject.add( gyroscopeObject1 );
    gyroscopeObject.add( gyroscopeObject2 );
    gyroscopeObject.add( gyroscopeObject3 );
    gyroscopeObject.add( gyroscopeObject4 );
    
    gyroscopeCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderGyroscope() {
    if (!gyroscopeCreated) return;
}



var rainObject,
    rainCloud,
    rainGeometry,
    rainShaderMaterial,
    rainShaderUniforms,
    rainSize = 5,
    rainParticlesTotal = 50,
    rainRingRadius = 40,
    rainBuffer = globeRadius - 15,
    rainMaxDistance = 100,
    rainFadeDistance = 15,
    rainVelocityFactor = 0.0016,
    rainDetails = [],
    rainCreated = false;
function createRain(callbackFn) {
    rainObject  = new THREE.Group;
    rainObject.name = 'rainObject';
    scene.add(rainObject);
    
    rainGeometry = new THREE.BufferGeometry();
    
    rainShaderUniforms = {
        color:     { value: colorBase },
        texture:   { value: new THREE.TextureLoader().load( "img/dot-inverted.png" ) }
    };
    rainShaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       rainShaderUniforms,
        vertexShader:   document.getElementById( 'particle_vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'particle_fragmentshader' ).textContent,
        transparent:    true,
        blending:       THREE.AdditiveBlending,
        depthTest:      false
    });
    
    var positions = new Float32Array( rainParticlesTotal * 3 );
    var alphas = new Float32Array( rainParticlesTotal * 3 );
    var sizes = new Float32Array( rainParticlesTotal );
    //var rainSpread = rainMaxDistance/rainParticlesTotal;
    
    var circleAngle = 2 * Math.PI / rainParticlesTotal;
    
    for ( var i = 0, i3 = 0; i < rainParticlesTotal; i ++, i3 += 3 ) {
        
        var circleRadius = (Math.random() * rainRingRadius);
        
        // CREATE THE VERTICES ALL IN THE POSITIVE
        var vertex = new THREE.Vector3();
        vertex.x = circleRadius * Math.cos(circleAngle * i);
        vertex.y = Math.random() * rainMaxDistance;
        vertex.z = circleRadius * Math.sin(circleAngle * i);
        
        var destinationY = rainBuffer + rainMaxDistance;
        var startSize = Math.random() * rainSize;
        var startAlpha = Math.random() * 1;
        var startPercentage = (rainMaxDistance - vertex.y)/rainMaxDistance;
        var startVelocity = (1 - startPercentage) * ((rainMaxDistance * 2) / 100);
        
        // ADD THE CENTER DEAD ZONE
        vertex.y = vertex.y + rainBuffer;
        var originY = rainBuffer;
        
        // MAKE EVERY OTHER PARTICLE NEGATIVE
        if(i % 2 === 0) {
            vertex.y = -vertex.y;
            originY = -originY;
            destinationY = -destinationY;
        }
        
        positions[ i3 + 0 ] = vertex.x;
        positions[ i3 + 1 ] = vertex.y;
        positions[ i3 + 2 ] = vertex.z;
        sizes[ i ] = startSize;
        alphas[ i ] = 1; //startAlpha;
        
        rainDetails.push({
            origin: new THREE.Vector3(vertex.x, originY, vertex.z),
            current: new THREE.Vector3(vertex.x, vertex.y, vertex.z),
            destination: new THREE.Vector3(vertex.x, destinationY, vertex.z),
            size: startSize,
            alpha: startAlpha,
            velocity: startVelocity
        });
    }
    
    rainGeometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    rainGeometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    rainGeometry.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
    rainCloud = new THREE.Points( rainGeometry, rainShaderMaterial );
    rainObject.add( rainCloud );
    
    rainCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderRain() {		
    rainObject.rotation.y += rainObject.rotation.z + 0.0075;
    
    var attributes = rainGeometry.attributes;
    
    for ( var i = 0, i3 = 0; i < rainDetails.length; i ++, i3 += 3 ) {
        var pd = rainDetails[i];
        
        // MOVE THE PARTICLE UP/DOWN
        pd.velocity += rainVelocityFactor;
        if (pd.current.y > 0) {
            if (pd.current.y > pd.destination.y) {
                pd.current.y = rainBuffer;
                pd.velocity = 0;
            }
            pd.current.y = pd.current.y + pd.velocity;
        } else if (pd.current.y < 0) {
            if (pd.current.y < pd.destination.y) {
                pd.current.y = pd.origin.y;
                pd.velocity = 0;
            }
            pd.current.y = pd.current.y - pd.velocity;
        }
        attributes.position.array[ i3 + 1 ] = pd.current.y;
        
        // FADE THE PARTICLE IN
        if (pd.current.y > 0) {
            pd.alpha = (pd.current.y - rainBuffer) / ((pd.origin.y - rainBuffer) + rainFadeDistance);
        } else if (pd.current.y < 0) {
            pd.alpha = (pd.current.y + rainBuffer) / ((pd.origin.y + rainBuffer) - rainFadeDistance);
        }
        if (pd.alpha > 1) pd.alpha = 1;
        attributes.alpha.array[ i ] = pd.alpha;
        attributes.size.array[ i ] = pd.size * pd.alpha;
        
    }
    attributes.position.needsUpdate = true;
    attributes.alpha.needsUpdate = true;
    attributes.size.needsUpdate = true;
}



var rendererPixi,
    stagePixi,
    minimapVizGroup,
    minimapDetails,
    minimapMaskGradient,
    minimapLines,
    minimapExtras1,
    minimapExtras2,
    minimapSpiral,
    minimapSpikesGroup,
    minimapBlipsGroup,
    minimapXArray,
    minimapBlipArray,
    minimapBgCreated = false;
function createMinimapBg(callbackFn) {
    
    rendererPixi = new PIXI.autoDetectRenderer(1000, 320, {
        transparent: true,
        antialias: true
    });
    stagePixi = new PIXI.Stage();
    $("#minimapBackground").append(rendererPixi.view);

    minimapVizGroup = new PIXI.Container();
    stagePixi.addChild(minimapVizGroup);

    //DETAILS
    minimapDetails = new PIXI.Sprite.fromImage('img/mapDetails.png');
    minimapVizGroup.addChild(minimapDetails);
    minimapDetails.position.x = 0;
    minimapDetails.position.y = 0;
    minimapDetails.width = 1000;
    minimapDetails.height = 320;
    minimapDetails.tint = 0x33CCFF;

    // GRADIENT MASK
    minimapMaskGradient = new PIXI.Sprite.fromImage('img/mapGradient2.png');
    minimapVizGroup.addChild(minimapMaskGradient);
    minimapMaskGradient.position.x = 500;
    minimapMaskGradient.position.y = 160;
    minimapMaskGradient.width = 1000;
    minimapMaskGradient.height = 320;
    minimapMaskGradient.pivot.x = 500;
    minimapMaskGradient.pivot.y = 160;
    minimapMaskGradient.scale.x = 0;

    // LINES
    minimapLines = new PIXI.Sprite.fromImage('img/mapLines.png');
    minimapVizGroup.addChild(minimapLines);
    minimapLines.position.x = 0;
    minimapLines.position.y = 0;
    minimapLines.width = 1000;
    minimapLines.height = 320;
    minimapLines.tint = 0xFFFFFF;
    minimapLines.mask = minimapMaskGradient;

    minimapExtras1 = new PIXI.Sprite.fromImage('img/mapExtras1.png');
    minimapVizGroup.addChild(minimapExtras1);
    minimapExtras1.pivot.x = 160;
    minimapExtras1.pivot.y = 160;
    minimapExtras1.position.x = 500;
    minimapExtras1.position.y = 160;
    minimapExtras1.alpha = 0;

    minimapExtras2 = new PIXI.Sprite.fromImage('img/mapExtras2.png');
    minimapVizGroup.addChild(minimapExtras2);
    minimapExtras2.pivot.x = 160;
    minimapExtras2.pivot.y = 160;
    minimapExtras2.position.x = 500;
    minimapExtras2.position.y = 160;
    minimapExtras2.alpha = 0;

    minimapMaskCircle = new PIXI.Sprite.fromImage('img/mapCircles.png');
    minimapVizGroup.addChild(minimapMaskCircle);
    minimapMaskCircle.position.x = 0;
    minimapMaskCircle.position.y = 0;
    minimapMaskCircle.width = 1000;
    minimapMaskCircle.height = 320;

    minimapSpiral = new PIXI.Sprite.fromImage('img/mapGradient1.png');
    minimapVizGroup.addChild(minimapSpiral);
    minimapSpiral.position.x = 500;
    minimapSpiral.position.y = 160;
    minimapSpiral.width = 1000;
    minimapSpiral.height = 320;
    minimapSpiral.pivot.x = 500;
    minimapSpiral.pivot.y = 160;
    minimapSpiral.scale.x = 0.05;
    minimapSpiral.alpha = 0;
    minimapSpiral.mask = minimapMaskCircle;

    minimapSpikesGroup = new PIXI.Container();
    minimapVizGroup.addChild(minimapSpikesGroup);
    minimapSpikesGroup.width = 320;
    minimapSpikesGroup.height = 320;
    minimapSpikesGroup.x = 500;
    minimapSpikesGroup.y = 160;
    minimapSpikesGroup.scale.x = 0;
    minimapSpikesGroup.scale.y = 0;

        var minimapX1 = new PIXI.Graphics();
        minimapSpikesGroup.addChild(minimapX1);
        minimapX1.beginFill(0xFFFFFF, 1);
        minimapX1.drawRect(0, 0, 1, 35);
        minimapX1.endFill();
        minimapX1.pivot.x = 0.5;
        minimapX1.pivot.y = 35;
        minimapX1.rotation = 45 * toRAD;
        minimapX1.position.x = -90;
        minimapX1.position.y = 90;

        var minimapX2 = new PIXI.Graphics();
        minimapSpikesGroup.addChild(minimapX2);
        minimapX2.beginFill(0xFFFFFF, 1);
        minimapX2.drawRect(0, 0, 1, 35);
        minimapX2.endFill();
        minimapX2.pivot.x = 0.5;
        minimapX2.pivot.y = 35;
        minimapX2.rotation = 135 * toRAD;
        minimapX2.position.x = -90;
        minimapX2.position.y = -90;

        var minimapX3 = new PIXI.Graphics();
        minimapSpikesGroup.addChild(minimapX3);
        minimapX3.beginFill(0xFFFFFF, 1);
        minimapX3.drawRect(0, 0, 1, 35);
        minimapX3.endFill();
        minimapX3.pivot.x = 0.5;
        minimapX3.pivot.y = 35;
        minimapX3.rotation = 225 * toRAD;
        minimapX3.position.x = 90;
        minimapX3.position.y = -90;

        var minimapX4 = new PIXI.Graphics();
        minimapSpikesGroup.addChild(minimapX4);
        minimapX4.beginFill(0xFFFFFF, 1);
        minimapX4.drawRect(0, 0, 1, 35);
        minimapX4.endFill();
        minimapX4.pivot.x = 0.5;
        minimapX4.pivot.y = 35;
        minimapX4.rotation = 315 * toRAD;
        minimapX4.position.x = 90;
        minimapX4.position.y = 90;

    // BLIPS
    minimapBlipsGroup = new PIXI.Container();
    minimapVizGroup.addChild(minimapBlipsGroup);
    minimapBlipsGroup.width = 320;
    minimapBlipsGroup.height = 320;
    minimapBlipsGroup.x = 500;
    minimapBlipsGroup.y = 160;
    minimapBlipsGroup.scale.x = 0;
    minimapBlipsGroup.scale.y = 0;

        var minimapBlip1 = new PIXI.Graphics();
        minimapBlip1.beginFill(0xFFFFFF);
        minimapBlip1.drawCircle(0, 0, 1);
        minimapBlip1.endFill();
        minimapBlip1.position.x = -95;
        minimapBlip1.position.y = -95;
        minimapBlipsGroup.addChild(minimapBlip1);

        var minimapBlip2 = new PIXI.Graphics();
        minimapBlip2.beginFill(0xFFFFFF);
        minimapBlip2.drawCircle(0, 0, 1);
        minimapBlip2.endFill();
        minimapBlip2.position.x = 95;
        minimapBlip2.position.y = -95;
        minimapBlipsGroup.addChild(minimapBlip2);

        var minimapBlip3 = new PIXI.Graphics();
        minimapBlip3.beginFill(0xFFFFFF);
        minimapBlip3.drawCircle(0, 0, 1);
        minimapBlip3.endFill();
        minimapBlip3.position.x = -95;
        minimapBlip3.position.y = 95;
        minimapBlipsGroup.addChild(minimapBlip3);

        var minimapBlip4 = new PIXI.Graphics();
        minimapBlip4.beginFill(0xFFFFFF);
        minimapBlip4.drawCircle(0, 0, 1);
        minimapBlip4.endFill();
        minimapBlip4.position.x = 95;
        minimapBlip4.position.y = 95;
        minimapBlipsGroup.addChild(minimapBlip4);

    minimapXArray = [minimapX1, minimapX2, minimapX3, minimapX4];
    minimapBlipArray = [minimapBlip1, minimapBlip2, minimapBlip3, minimapBlip4];
    
    minimapBgCreated = true;
    
    if (callbackFn) {
        callbackFn();
    }
}

function renderMinimapBg() {
    rendererPixi.render(stagePixi);
}



function checkDistance(a, b) {
    return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y) + (b.z - a.z) * (b.z - a.z) );
}

function latLongToVector3(lat, lon, radius, height) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;
    var x = -(radius+height) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+height) * Math.sin(phi);
    var z = (radius+height) * Math.cos(phi) * Math.sin(theta);
    return new THREE.Vector3(x,y,z);
}

function animate() {
    requestAnimationFrame( animate );		
    render();
    if (statsCreated) {
        stats.update();
    }
}

var cameraDirection = "left";
var cameraTarget = "auto";
var rotationSpeed = { value: 0.001 };
var dragSpeed = 0.1;
var dragZone = 25;
var dragSpeedSlowZone = (globeMaxZoom + dragZone);

function render() {
    renderer.render( scene, camera );
    
    // DON'T DO ANYTHING IF SECTION NOT FULLY IN
    if (isGlobeEventsEnabled) {
        // ZOOM LEVEL
        if (targetCameraZ < globeMaxZoom) targetCameraZ = globeMaxZoom;
        if (targetCameraZ > globeMinZoom) targetCameraZ = globeMinZoom;
        camera.position.z = camera.position.z += ( targetCameraZ - camera.position.z ) * 0.01;			
    }
    
    // DON'T TRY AND ROTATE THE MAP UNLESS USER HAS ROTATED GLOBE MANUALLY
    if ( targetCameraZ < dragSpeedSlowZone ){
        //dragSpeed = 0.025;
    }
    if ( isGlobeRotated ) {
        // ROTATION UP/DOWN
        if (targetRotationX > 75 * toRAD) targetRotationX = 75 * toRAD; 
        if (targetRotationX < -75 * toRAD) targetRotationX = -75 * toRAD;
        rotationObject.rotation.x = rotationObject.rotation.x += ( targetRotationX - rotationObject.rotation.x ) * dragSpeed;
        rotationObject.rotation.y = rotationObject.rotation.y += ( targetRotationY - rotationObject.rotation.y ) * dragSpeed;
    } 
    if (cameraTarget == "auto" && isGlobeRotated) {
        if (isMouseDown || isParticleHit || isMediaHit) {
            // TODO
        } else {
            switch (cameraDirection) {
                case "left":
                    targetRotationY += rotationSpeed.value;
                    break;
                case "right":
                    targetRotationY -= rotationSpeed.value;
                    break;
            }
        }
    }
    
    if (globeCreated) renderGlobe();
    if (dotsCreated) renderDots();
    if (mediaCreated) renderMedia();
    if (starsCreated) renderStars();
    if (ringPulseCreated) renderRingPulse();
    if (gyroscopeCreated) renderGyroscope();
    if (rainCreated) renderRain();
    if (ringsCreated) renderRings();
    if (minimapBgCreated) renderMinimapBg();
    
    
    if (colorTypeCurrent == "cycle") {
        setColors("cycle");
    }
    
    checkHover();
}


var currentLocationTitle = "";

function checkHover() {
    if (!isMouseMoved) return;
    
    globeRaycaster.setFromCamera( mouse, camera );
    var intersects = globeRaycaster.intersectObjects( dotSpritesArray , true);
    var intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
    if ( intersects.length > 0 ) {
        var tempCurrentLocationTitle = dataMap[intersection.object.userData.id][4];
        var tempHoverTarget = dotSpritesHoverArray[intersection.object.userData.id];
        if (!isParticleHit || tempCurrentLocationTitle != currentLocationTitle) {
            currentLocationTitle = tempCurrentLocationTitle;
            isParticleHit = true;
            showTooltip();
            if (!TweenMax.isTweening(tempHoverTarget.scale)) {
                TweenMax.fromTo( tempHoverTarget.scale, 1, { x: 2, y: 2 }, { x: 10, y: 10, ease: Expo.easeOut });
                TweenMax.fromTo( tempHoverTarget.material, 1.5, { opacity: 1 }, { opacity: 0,
                    onStart:function(){
                        tempHoverTarget.visible = true;
                    },
                    onComplete:function(){
                        tempHoverTarget.visible = false;
                    }
                });
            }
        } else {
            //dotSpikeHover.visible = true;
        }
    } else {
        currentLocationTitle = "";
        isParticleHit = false;
        //hideTooltip();
        if (!isMediaHit) {
            hideTooltip();
        }
    }
            
    // MEDIA HOVER V2
    var intersects = globeRaycaster.intersectObject( mediaCloud, true );
    var intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
    if ( intersects.length > 0 ) {
        var tempCurrentLocationTitle = "<b>" + dataMedia[intersection.index][0] + "</b> - " + dataMedia[intersection.index][4];{
        currentLocationTitle = tempCurrentLocationTitle;
        if (!isMediaHit) 
            isMediaHit = true;
            showTooltip();
        }
    } else {
        currentLocationTitle = "";
        isMediaHit = false;
        //hideTooltip();
        if (!isParticleHit) {
            hideTooltip();
        }
    }
}

// SHOW/HIDE THE TOOLTIP
var isTooltipVisible = false;
function showTooltip(type) {
    container.style.cursor = 'pointer';
    $('#tooltip').html('<div class="label">' + currentLocationTitle + '</div>');
    if (!isTooltipVisible) {
        isTooltipVisible = true;
        if (clientMouseX > (window.innerWidth - 250)) {
            TweenMax.fromTo( "#tooltip", 1, { x: -100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, display: 'inline-block', ease: Expo.easeOut, delay: 0.1 });
            document.getElementById("tooltip").style.textAlign = "right";
        } else {
            TweenMax.fromTo( "#tooltip", 1, { x: 100, autoAlpha: 0 }, { x: 0, autoAlpha: 1, display: 'inline-block', ease: Expo.easeOut, delay: 0.1 });
            document.getElementById("tooltip").style.textAlign = "left";
        }
    }
}

function hideTooltip() {
    isTooltipVisible = false;
    if (isMouseDown) {
        container.style.cursor = 'move';
    } else {
        //container.style.cursor = 'auto';
        container.style.cursor = 'move';
    }
    TweenMax.set( "#tooltip", { autoAlpha: 0, display: 'none' });
}

function checkClick() {
    globeRaycaster.setFromCamera( mouse, camera );
    
    // DOTS
    var intersects = globeRaycaster.intersectObjects( dotSpritesArray , true);
    var intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
    if ( intersects.length > 0 ) {
        
        var bookType = dataMap[intersection.object.userData.id][1]
        var bookDescription = "";
        if (bookType === 0) bookDescription = "E-BOOK";
        if (bookType === 1) bookDescription = "PAPERBACK";
        if (bookType === 2) bookDescription = "HARDCOVER";
        
        TweenMax.killTweensOf( "#location", false) ;
        var tl =  new TimelineMax({ paused: true } );			
        tl.fromTo( "#location", 0.5, { autoAlpha: 0 }, { autoAlpha: 1, display: 'block', immediateRender: false, ease: Linear.easeNone }, 0 );
        tl.fromTo( "#location .title", 1, { scrambleText:{ text: " " } }, { scrambleText:{ text: dataMap[intersection.object.userData.id][4], chars:"0123456789!@#$%^&*()" }, ease: Expo.easeInOut }, 0 );
        tl.fromTo( "#location .booktype", 1, { scrambleText:{ text: " " } }, { scrambleText:{ text: bookDescription, chars:"0123456789!@#$%^&*()" }, ease: Expo.easeInOut }, 0 );
        tl.fromTo( "#location", 1, { autoAlpha: 1 }, { autoAlpha: 0, immediateRender: false, ease: Linear.easeNone }, 1 );
        tl.play(0);
    }

    // MEDIA
    var intersects = globeRaycaster.intersectObject( mediaCloud, true);
    var intersection = ( intersects.length ) > 0 ? intersects[ 0 ] : null;
    if ( intersects.length > 0 ) {
        var mediaDestination = dataMedia[intersection.index][5];
        intersection.index
        window.open(mediaDestination,"_blank");
    }
    
    
}
    
// HEADER TAGLINE GENERATION
function changeTagline() {
    var taglineArray = [
        ["01","You are only as good as your last project."],
        ["153","The details matter."],
        ["181","Don’t Blend in. Stand Out."],
        ["182","If potential clients or the community don't see you or your work, then you don't exist."],
        ["199","Make cool shit for the love of creativity, and the money will come as a result."],
        ["231","Always charge for your knowledge, experience and creativity."],
        ["240","Freelance or full-time, you are your own business and your time is valuable."],
        ["289","Plan vacations first. Worry about projects & deadlines second."],
        ["07","Dedication, passion and commitment are equally as important as artistic talent."],
        ["25","Average is the opposite of great. Ordinary work will rarely achieve great attention."],
        ["221","Sometimes you must be able to play the games and run with the wolves to move up the food chain."],
        ["222","Job frustration can be a powerful motivator if you use it to your advantage."],
        ["284","If you don’t have a life or interests outside of work, you’ll never have anything original to put into your work."],
        ["19","Nothing changes if nothing changes."],
        ["14","Be prepared. Work hard. Love what you do. Finish every personal project."]
        ];
    var tempTaglineLength = taglineArray.length - 1;
    var tempTagline = generateRandomNumber(0,tempTaglineLength);
    $('#bookNumber').html(''); 
    $('#bookNumber').html('#' + taglineArray[tempTagline][0]); 
    $('#bookQuote').html(''); 
    $('#bookQuote').html('"' + taglineArray[tempTagline][1] + '"'); 
}

// BUTTONS LOGIC
function initButtons() {
    var isDragging = false;
    $('#minimap').mousedown(function(e) {
        //isDragging = false;
        setRotation("manual");
        isDragging = true;
    })
    .mousemove(function(e) {
        if (isDragging) {
            var offset_t = $(this).offset().top - $(window).scrollTop();
            var offset_l = $(this).offset().left - $(window).scrollLeft();
            var left = Math.round( (e.clientX - offset_l) );
            var top = Math.round( (e.clientY - offset_t) );
            var tempWidthPercentage = left/$(this).width();
            var tempHeightPercentage = top/$(this).height();
            var maxVertDegrees = 75;
            var maxHorizontalDegrees = 180;
            var mapTargetRotationX = tempHeightPercentage * (maxVertDegrees * 2) - (maxVertDegrees + 15);
            var mapTargetRotationY = tempWidthPercentage * (maxHorizontalDegrees * 2);
            var baseRotationX = (Math.round(rotationObject.rotation.x /radianLoop) * radianLoop);
            var baseRotationY = (Math.round(rotationObject.rotation.y /radianLoop) * radianLoop);
            targetRotationX = baseRotationX + (-mapTargetRotationX * toRAD);
            targetRotationY = baseRotationY - ((mapTargetRotationY - maxHorizontalDegrees) * toRAD);
        }
     })
    .mouseleave(function(e) {
        isDragging = false;
     })
    .mouseup(function(e) {
        var wasDragging = isDragging;
        isDragging = false;
        setRotation("manual");
        
        //if (!wasDragging) { }
        
        var offset_t = $(this).offset().top - $(window).scrollTop();
        var offset_l = $(this).offset().left - $(window).scrollLeft();
        var left = Math.round( (e.clientX - offset_l) );
        var top = Math.round( (e.clientY - offset_t) );
        var tempWidthPercentage = left/$(this).width();
        var tempHeightPercentage = top/$(this).height();
        var maxVertDegrees = 75;
        var maxHorizontalDegrees = 180;
        var mapTargetRotationX = tempHeightPercentage * (maxVertDegrees * 2) - (maxVertDegrees + 15);
        var mapTargetRotationY = tempWidthPercentage * (maxHorizontalDegrees * 2);
        var baseRotationX = (Math.round(rotationObject.rotation.x /radianLoop) * radianLoop);
        var baseRotationY = (Math.round(rotationObject.rotation.y /radianLoop) * radianLoop);
        targetRotationX = baseRotationX + (-mapTargetRotationX * toRAD);
        targetRotationY = baseRotationY - ((mapTargetRotationY - maxHorizontalDegrees) * toRAD);
    });
    
    $('#palette').click(function(e) {
        setColors("random");
    });
        
    if (!deviceSettings.isMobile) {
        $('.close').hover(function(e) {
            TweenMax.to( ".close line", 0.5, { drawSVG: "30% 70%", stroke: colorSecondary, ease: Expo.easeOut } );
            TweenMax.fromTo( ".close circle", 0.5, { drawSVG: "50% 50%", stroke: colorSecondary }, { drawSVG: "35% 65%", stroke: colorPrimary, display: 'block', ease: Expo.easeOut } );
            TweenMax.fromTo( ".close circle", 0.25, { autoAlpha: 0 }, { autoAlpha: 1, ease: Linear.easeNone } );
        }, function(e) {
            TweenMax.to( ".close line", 0.5, { drawSVG: "0 100%", stroke: colorPrimary, ease: Expo.easeOut } );
            TweenMax.to( ".close circle", 0.5, { drawSVG: "50% 50%", stroke: colorSecondary, autoAlpha: 0, ease: Expo.easeOut } );
            TweenMax.to( ".close circle", 0.5, { autoAlpha: 0, ease: Linear.easeNone } );
        });
        /*
        $('#nav-left a, #nav-right a').hover(function(e) {
            var tempText = $(this).attr("data-id");
            TweenMax.fromTo( this, 1, { scrambleText:{ text: " " }, autoAlpha: 0 }, { scrambleText:{ text: tempText, chars:"0123456789!@#$%^&*()", revealDelay: 0.1 }, autoAlpha: 1 });
        }, function(e) {
        });
        */
        $(document).keydown(function (e) {
            var keyCode = e.keyCode || e.which, key = {
                    left: 37, up: 38, right: 39, down: 40,
                    blue: 66, invert: 73, random: 82
                };
            var tempRotation = (20 * toRAD);
            switch (keyCode) {
                case key.left:
                    targetRotationY = targetRotationY - tempRotation;
                     cameraDirection = "right";
                    break;
                case key.right:
                    targetRotationY = targetRotationY + tempRotation;
                    cameraDirection = "left";
                    break;
                case key.up:
                    //targetRotationX = targetRotationX + tempRotation;
                    targetCameraZ = targetCameraZ - 20;
                    break;
                case key.down:
                    //targetRotationX = targetRotationX - tempRotation;
                    targetCameraZ = targetCameraZ + 20;
                    break;
                case key.blue:
                    setColors("blue");
                    break;
                case key.invert:
                    setColors("invert");
                    break;
                case key.random:
                    setColors("random");
                    break;
            }
        });
        

        // BOOK HOVER

        $('.book').hover(
            function(){
                TweenMax.to( $(this).find('.overlay'), 0.75, { autoAlpha: 1, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.overlay'), 0.75, { rotationY: -40, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.cover'), 0.75, { rotationY: -40, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.page1'), 0.75, { rotationY: -34, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.page2'), 0.75, { rotationY: -27, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.page3'), 0.75, { rotationY: -15, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( "#buytext", 0.75, { y: 15, immediateRender: false, ease: Expo.easeOut } );
            },
            function(){
                TweenMax.to( $(this).find('.overlay'), 0.5, { autoAlpha: 0, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.overlay'), 0.5, { rotationY: 0, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.cover'), 0.5, { rotationY: 0, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( $(this).find('.page'), 0.5, { rotationY: 0, immediateRender: false, ease: Expo.easeOut } );
                TweenMax.to( "#buytext", 0.5, { y: 0, immediateRender: false, ease: Expo.easeOut } );
         });
    }
}

// RESET ANIMATIONS
function resetAnimations(instant) {
    lineStepStarted = 0;
    lineStepCompleted = 0;
    
    // HIDE AND RESET ALL LINES
    if (scene.getObjectByName('arcsRocket')) {
        //if (!arcRocketCreated) return;
        var attributes = arcRocketBufferGeometry.attributes;
        for ( var i = 0; i < arcRocketDetailsArray.length; i++ ) {
            attributes.alpha.array[ i ] = 0;
        }
        attributes.alpha.needsUpdate = true;
        
        arcRocketAnimation.pause(0);
        arcRocketObject.visible = false;
        earthObject.remove( arcRocketObject );
    }

    if (scene.getObjectByName('arcsSnake')) {
        //if (!arcSnakeCreated) return;
        var attributes = arcSnakeBufferGeometry.attributes;
        for ( var i = 0; i < arcSnakeDetailsArray.length; i++ ) {
            attributes.alpha.array[ i ] = 0;
        }
        attributes.alpha.needsUpdate = true;

        arcSnakeAnimation.pause(0);
        arcSnakeObject.visible = false;
        earthObject.remove( arcSnakeObject );
    }
    
    if (scene.getObjectByName('arcsAll')) {
        arcAllAnimation.pause(0);
        arcAllObject.visible = false;
        earthObject.remove( arcAllObject );
    }
    
}

// UI FUNCTIONS
function setRotation(type) {
    $('#rotationMode a').removeClass('active');
    if (type === "toggle") {
        switch (cameraTarget) {
            case "auto":
                type = "manual";
                //$('#rotationMode a').html("off");
                break;
            case "manual":
                type = "auto";
                //$('#rotationMode a').html(type);
                break;
        }
    }
    cameraTarget = type;
    switch (cameraTarget) {
        case "auto":
            $('#rotationMode a.auto').addClass('active');
            $('#rotationMode a').html("AUTO");
            break;
        case "manual":
            $('#rotationMode a.manual').addClass('active');
            $('#rotationMode a').html("OFF");
            break;
    }
}

function toggleRotation() {
    if (cameraTarget == "auto") {
        setRotation("manual");
    } else {
        setRotation("auto");
    }
}

var currentAnimationType = "";
function setArcAnimation(type) {
    
    if (!arcRocketCreated) {
        createArcsRocket();
    }
    if (!arcSnakeCreated) {
        createArcsSnake();
    }
    if (!arcAllCreated) {
        createArcsAll();
    }
    
    if (currentAnimationType === type) {
        type = "off";
    }
    
    currentAnimationType = type;
    resetAnimations();
    $('#arcMode a').removeClass('active');
    switch (type) {
        case "rocket":
            earthObject.add( arcRocketObject );
            arcRocketObject.visible = true;
            arcRocketAnimation.play(0);
            $('#arcMode a.rocket').addClass('active');
            break;
        case "snake":
            earthObject.add( arcSnakeObject );
            arcSnakeObject.visible = true;
            arcSnakeAnimation.play(0);
            $('#arcMode a.snake').addClass('active');
            break;
        case "all":
            arcAllAnimation.play(0);
            earthObject.add( arcAllObject );
            arcAllObject.visible = true;
            $('#arcMode a.all').addClass('active');
            break;
        case "off":
            //$('#arcMode a.off').addClass('active');
            break;
    }
    if (isIntroDone) {
        generateGlitch();
    }
}

var colorTypeCurrent = "";
function setColors(type) {
    //if (colorTypeCurrent != type) { }
    
    colorTypeCurrent = type;
    $('#colorMode a').removeClass('active');
    
    switch (type) {
        case "off":
            colorPrimary 	= "#FFFFFF";
            colorSecondary 	= "#FFFFFF";
            $('#colorMode a.off').addClass('active');
            break;
        case "blue":
            colorPrimary 	= colorPrimary_Base;
            colorSecondary 	= colorSecondary_Base;
            $('#colorMode a.blue').addClass('active');
            break;
        case "invert":
            if (colorPrimary === "#FFFFFF" && colorSecondary === "#FFFFFF") {
                colorPrimary 	= colorPrimary_Base;
                colorSecondary 	= colorSecondary_Base;
            }
            var tempColorPrimary = colorPrimary;
            var tempColorSecondary = colorSecondary;
            colorPrimary 	= tempColorSecondary;
            colorSecondary 	= tempColorPrimary;
            $('#colorMode a.invert').addClass('active');
            break;
        case "random":
            colorPrimary 	= "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
            colorSecondary 	= "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
            $('#colorMode a.random').addClass('active');
            break;
        case "cycle":
            var time = Date.now() * 0.00005;
            h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
            var tempPrimary = new THREE.Color(colorPrimary);
            colorPrimary = tempPrimary.setHSL( h, 0.5, 0.5 );
            colorPrimary = "#" + colorPrimary.getHexString();
            var tempSecondary = new THREE.Color(colorSecondary);
            colorSecondary = tempSecondary.setHSL( h, 0.5, 0.5 );
            colorSecondary = "#" + colorSecondary.getHexString();
            $('#colorMode a.cycle').addClass('active');
            break;
    }

    // CREATE ALL OF THE COLORS
    colorBase 	= new THREE.Color(colorPrimary);
    colorBase50 = new THREE.Color(shadeBlend(0.50, colorPrimary, colorDarken));
    colorBase75 = new THREE.Color(shadeBlend(0.75, colorPrimary, colorDarken));
    colorBase85 = new THREE.Color(shadeBlend(0.85, colorPrimary, colorDarken));
    colorHighlight 	= new THREE.Color(colorSecondary);
    
    if (scene.getObjectByName('rain')) {
        rainCloud.material.uniforms.color.value = new THREE.Color(colorPrimary);
        rainCloud.material.uniforms.needsUpdate = true;
    }

    // UPDATE LIGHTS
    if (lightsCreated) {
        lightShield1.color = colorBase;
        lightShield2.color = colorBase;
        lightShield3.color = colorBase;
        lightShield1.needsUpdate = true;
        lightShield2.needsUpdate = true;
        lightShield3.needsUpdate = true;
    }
    if (ringsCreated) {
        ringsOuterMaterial.color = colorBase75; //colorBase85;
        ringsInnerMaterial.color = colorBase50; //colorBase75;
        ringsOuterMaterial.needsUpdate = true;
        ringsInnerMaterial.needsUpdate = true;
    }
    if (universeCreated) {
        universeBgMaterial.color = colorBase;
        universeBgMaterial.needsUpdate = true;
    }
    if (globeCreated) {
        globeInnerMaterial.color = colorBase75;
        globeOuterMaterial.color = colorBase;
        globeShieldMaterial.color = colorBase75;
        globeGlowMaterial.color = colorBase;
        globeInnerMaterial.needsUpdate = true;
        globeOuterMaterial.needsUpdate = true;
        globeShieldMaterial.needsUpdate = true;
        globeGlowMaterial.needsUpdate = true;
        
        // COLOR CHECKERED UPDATE
        var colors = new Float32Array(globeCloudVerticesArray.length * 3);
        var globeCloudColors = [];
        for( var i = 0; i < globeCloudVerticesArray.length; i++ ) {
            var tempPercentage = generateRandomNumber( 85, 90 ) * .01;
            var shadedColor = shadeBlend(tempPercentage, colorPrimary, colorDarken);
            globeCloudColors[i] = new THREE.Color(shadedColor);
        }
        for (var i = 0; i < globeCloudVerticesArray.length; i++) {
            colors[i * 3] = globeCloudColors[i].r;
            colors[i * 3 + 1] = globeCloudColors[i].g;
            colors[i * 3 + 2] = globeCloudColors[i].b;
        }
        globeCloudBufferGeometry.addAttribute( 'color', new THREE.BufferAttribute(colors, 3));
        globeCloudBufferGeometry.colorsNeedUpdate = true;
    }
    if (dotsCreated) {
        dotMaterial.color = colorHighlight;
        dotSpikesMaterial.color = colorHighlight;
        //dotSpikesExtraMaterial.color = colorBase;
        dotMaterial.needsUpdate = true;
        dotSpikesMaterial.needsUpdate = true;
        //dotSpikesExtraMaterial.needsUpdate = true;
        for (var i = 0; i < dotSpritesHoverArray.length; i++) {
            dotSpritesHoverArray[i].material.color = colorHighlight;
            dotSpritesHoverArray[i].material.needsUpdate = true;
        }
    }
    if (starsCreated) {
        starsMaterial.color = colorBase50;
        starsMaterial.needsUpdate = true;
    }
    if (arcRocketCreated) {
        //if (scene.getObjectByName('arcsRocket')) {}
        arcRocketMesh.material.uniforms.color.value = colorHighlight;
        arcRocketMesh.material.uniforms.needsUpdate = true;
    }
    if (arcSnakeCreated) {
        //if (scene.getObjectByName('arcsSnake')) {}
        arcSnakeMesh.material.uniforms.color.value = colorHighlight;
        arcSnakeMesh.material.uniforms.needsUpdate = true;
    }
    if (arcAllCreated) {
        //if (scene.getObjectByName('arcsAll')) {}
        arcAllMaterial.color = colorHighlight;
        arcAllMaterial.needsUpdate = true;
    }
    if (spikesCreated) {
        spikesMaterial.color = colorBase75;
        spikesMaterial.needsUpdate = true;
    }
    if (ringPulseCreated) {
        //if (scene.getObjectByName('ringPulse')) {}
        ringPulseMesh.material.uniforms.color.value = colorBase;
        ringPulseMesh.material.uniforms.needsUpdate = true;
        
        ringExplosionMaterial.color = colorBase85;
        ringExplosionMaterial.needsUpdate = true;
        
        ringPointMaterial.color = colorBase75;
        ringPointMaterial.needsUpdate = true;
    }
    if (gyroscopeCreated) {
        //gyroscopeMaterial.color = colorHighlight;
        //gyroscopeMaterial.needsUpdate = true;
        gyroscopeMesh1.material.color = colorBase;
        gyroscopeMesh2.material.color = colorBase;
        gyroscopeMesh3.material.color = colorBase;
        gyroscopeMesh4.material.color = colorBase;
        gyroscopeMesh1.material.needsUpdate = true;
        gyroscopeMesh2.material.needsUpdate = true;
        gyroscopeMesh3.material.needsUpdate = true;
        gyroscopeMesh4.material.needsUpdate = true;
    }
    if (rainCreated) {
        rainCloud.material.uniforms.color.value = colorBase;
        rainCloud.material.uniforms.needsUpdate = true;
    }

    // CHANGE SOME CSS VALUES
    if($("#customCSS").length == 1) {
        $('#customCSS').remove();
    }

    var tempRGB = hexToRgb(colorPrimary);
    var cssStyle = 
    '<style id="customCSS">'+
        'body, a:link, a:visited { color: ' + colorPrimary + ';} '+
        '.settings a { border-color: rgba(' + tempRGB.r + ', ' + tempRGB.g + ', ' + tempRGB.b + ', .15);} '+
        '.settings a.active { background-color: ' + colorPrimary + ';} '+
        '#rotationMode a { color: ' + shadeBlend(0.50, colorPrimary, colorDarken) + ';} '+
        '#rotationMode a.active { color: ' + colorPrimary + ';} '+
        '.svg-stop { stop-color: ' + colorPrimary + ';} '+
        '.pulseDot { background-color: ' + colorPrimary + ';} '+
        '.pulseTrail { background-color: ' + colorPrimary + ';} '+
        '#tooltip { background-color: ' + colorPrimary + ';} '+
        '#soundButton .bar:after { background-color: ' + colorPrimary + ';} '+
        '#soundButton .bar:after { background-color: ' + colorPrimary + ';} '+
        '#paletteHighlight { background-color: ' + colorSecondary + ';} '+
        '#paletteBase { background-color: ' + colorPrimary + ';} '+
        '#paletteBase50 { background-color: ' + shadeBlend(0.50, colorPrimary, colorDarken) + ';} '+
        '#paletteBase75 { background-color: ' + shadeBlend(0.75, colorPrimary, colorDarken) + ';} '+
        '#paletteBase85 { background-color: ' + shadeBlend(0.85, colorPrimary, colorDarken) + ';} '+
        '.minibar { background-color: ' + shadeBlend(0.50, colorSecondary, colorDarken) + ';} '+
        '#location { color: ' + colorSecondary + ';} '+
    '</style>';
    
    $('head').append(cssStyle);
    $('#minimap svg path, .svg-fill').css("fill", colorPrimary);
    $('.close .line1, .close .line2, .close .bracket_x, .close .circle_x, .svg-ring, .cross, .pulseCircle circle').css("stroke", colorPrimary);
    
    if (isIntroDone && colorTypeCurrent != "cycle") {
        generateGlitch();
    }
}



// HEADER TAGLINE GENERATION
var statNumber = 0;
function changeStat() {
    var statNumberArray = [
        "48",
        "36",
        "6",
        ];
    var statDescriptionArray = [
        "COUNTRIES",
        "U.S. STATES",
        "CONTINENTS",
        ];
    var tempStatLength = statNumberArray.length - 1;

    TweenMax.set( "#nav-stats", { transformPerspective: 800 });

    var statAnimation =  new TimelineMax({ paused: true, force3D: true, repeat: -1, delay: 1, repeatDelay: 0 });
    statAnimation.to( "#nav-stats", 1.5, { scaleX: 0.7, scaleY: 0.7, autoAlpha: 0, rotationY: -90, ease: Expo.easeIn, immediateRender: false }, 0 );
    statAnimation.fromTo( "#nav-stats", 3, 
        { scaleX: 0, scaleY: 0, autoAlpha: 0, rotationY: 180 }, 
        { scaleX: 1, scaleY: 1, autoAlpha: 1, rotationY: 0, ease: Expo.easeOut, immediateRender: false , onStart: function() {
            statNumber++;
            if (statNumber > tempStatLength){
                statNumber = 0
            }
            $('#nav-stats .number').html('');
            $('#nav-stats .number').html(statNumberArray[statNumber]);
            $('#nav-stats .description').html('');
            $('#nav-stats .description').html(statDescriptionArray[statNumber]);
        }, onComplete: function() {
            $('#nav-stats').removeAttr("style")
        }}, 1.5 );
    statAnimation.timeScale(1);
    statAnimation.play();
}



var isInfoVisible = false;
var infoSection = "";
function toggleInfo(target) {
    
    TweenMax.set("#overlayRing svg", { rotation: -90, transformOrigin:"center center"});
    TweenMax.set(".close .circles", { rotation: -180, transformOrigin:"center center"});
    
    if (isInfoVisible) {
        isInfoVisible = false;
        var tl =  new TimelineMax({ paused: true } );
        tl.to( "#overlay", 0.5, { autoAlpha: 0, ease: Linear.easeNone }, 0);
        tl.staggerTo( "#overlayRing .svg-ring", 0.5, { drawSVG: "50% 50%", ease: Expo.easeInOut }, 0.25, 0 );			
        tl.play(0);
    } else {
        infoSection = target;
        isInfoVisible = true;

        var tl =  new TimelineMax({ paused: true } );
        tl.fromTo( "#overlay", 0.5, { autoAlpha: 0 }, { autoAlpha: 1, display: 'block', ease: Linear.easeNone }, 0);
        tl.staggerFromTo( "#overlayRing .svg-ring", 2, { drawSVG: "50% 50%" }, { drawSVG: "0 100%", ease: Expo.easeInOut }, 0.25, 0 );
        tl.fromTo( "#" + target, 1, { autoAlpha: 0 }, { autoAlpha: 1, display: 'block', ease: Linear.easeNone }, 0.5 );
        tl.fromTo( "#overlayRing", 1, { autoAlpha: 0 }, { autoAlpha: 1, ease: Expo.easeOut }, 0.5 );
        tl.staggerFromTo( "#" + target + " .animate", 1, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: Expo.easeOut }, 0.1, 1);
        tl.fromTo( ".close line", 1, { drawSVG: "50% 50%", stroke: "#FFFFFF", autoAlpha: 0 }, { drawSVG: "0 100%", stroke: colorPrimary, autoAlpha: 1, ease: Expo.easeInOut }, 1 );
        
        tl.play(0);
        generateGlitch();
    }
}

function getDifference(a, b) {
    return Math.abs(a - b) 
}

// COLOR FUNCTIONS
function checkIsBlack(dataPixel){
    if(dataPixel[0]==dataPixel[1] && dataPixel[1]==dataPixel[2] && dataPixel[2]===0 ){
        return true
    } else {
        return false;
    }
}

function shadeBlend(p,c0,c1) {
    var n=p<0?p*-1:p,u=Math.round,w=parseInt;
    if(c0.length>7){
        var f=c0.split(","),t=(c1?c1:p<0?"rgb(0,0,0)":"rgb(255,255,255)").split(","),R=w(f[0].slice(4)),G=w(f[1]),B=w(f[2]);
        return "rgb("+(u((w(t[0].slice(4))-R)*n)+R)+","+(u((w(t[1])-G)*n)+G)+","+(u((w(t[2])-B)*n)+B)+")"
    }else{
        var f=w(c0.slice(1),16),t=w((c1?c1:p<0?"#000000":"#FFFFFF").slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF;
        return "#"+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1)
    }
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


var cometTotal = 15;
var cometRotation = 360/cometTotal;
function createGlitch(callbackFn) {
    ////TweenMax.set( ".cross", { stroke: "#FFFFFF", scaleX: 0, scaleY: 0, autoAlpha: 0 } );
    TweenMax.set( ".cross", { autoAlpha: 0 } );

    TweenMax.set("#pulseCircle1", { rotation: -180, transformOrigin:"center center" });

    $('#pulseComets').html('');
    for (var i=0; i < cometTotal; i++) {
        $('#pulseComets').prepend('<div class="pulseComet" id="pulseComet' + i + '"><div class="pulseTrail"></div><div class="pulseDot"></div></div>');
        TweenMax.set ( "#pulseComet" + i , { rotation: ( i * cometRotation ), transformOrigin: 'center bottom' });
    }
    
    if (callbackFn) {
        callbackFn();
    }
}


function generateExplosion() {
    console.log("EXPLOSION WOW OVERPOWERIN")
    var explosionAnimation =  new TimelineMax({ paused: true });
    explosionAnimation.fromTo( ringExplosionMesh.scale, 1, { x: 1, y: 1 }, { x: 3, y: 3, ease: Quint.easeOut }, 0 );
    explosionAnimation.fromTo( ringExplosionMesh.material, 0.25, { opacity: 0 }, { opacity: 1, ease: Linear.easeNone,
        onStart:function(){
            ringExplosionMesh.visible = true;
        }
    }, 0);
    explosionAnimation.fromTo( ringExplosionMesh.material, 0.75, { opacity: 1 }, { opacity: 0, immediateRender: false, ease: Linear.easeNone,
        onComplete:function(){
            ringExplosionMesh.visible = false;
        }
    }, 0.25);
    explosionAnimation.timeScale(1);
    explosionAnimation.play(0);
}


function generateGlitch() {
    /*
    if (gyroscopeCreated) {
        //var gyroscopeMeshArray1 = [gyroscopeMesh1.material, gyroscopeMesh2.material, gyroscopeMesh3.material, gyroscopeMesh4.material];
        //var gyroscopeMeshArray2 = [gyroscopeMesh1.rotation, gyroscopeMesh2.rotation, gyroscopeMesh3.rotation, gyroscopeMesh4.rotation];
        var gyroscopeMeshArray1 = [gyroscopeMesh1.material, gyroscopeMesh3.material, gyroscopeMesh2.material, gyroscopeMesh4.material];
        var gyroscopeMeshArray2 = [gyroscopeMesh1.rotation, gyroscopeMesh3.rotation, gyroscopeMesh2.rotation, gyroscopeMesh4.rotation];
        
        var gyroscopeAnimation =  new TimelineMax({ paused: true });
        gyroscopeAnimation.staggerFromTo( gyroscopeMeshArray1, 0.5, { opacity: 1 }, { opacity: 0,  immediateRender: false, ease: Linear.easeNone }, 0.1, 0.5 );
        gyroscopeAnimation.staggerFromTo( gyroscopeMeshArray1, 0.5, { opacity: 0 }, { opacity: 1, ease: Linear.easeNone }, 0.1, 0 );
        gyroscopeAnimation.staggerFromTo( gyroscopeMeshArray2, 1, { x: 0 * toRAD }, { x: 180 * toRAD, ease: Power2.easeInOut }, 0.1, 0 );
        gyroscopeAnimation.timeScale(0.5);
        gyroscopeAnimation.play(0);
    }
    */
    if (minimapBgCreated) {
        // && colorTypeCurrent != "cycle"
        var minimapAnimation =  new TimelineMax({ paused: true });
        minimapAnimation.to( minimapDetails, 2,  { pixi:{ tint: colorPrimary } }, 0 );
        minimapAnimation.fromTo( minimapLines, 2, { pixi:{ tint: 0xFFFFFF }}, { pixi:{ tint: colorPrimary }, ease: Circ.easeOut }, 0 );
        minimapAnimation.fromTo( minimapMaskGradient, 2, { pixi:{ scaleX: 0 }}, { pixi:{ scaleX: 1.25 }, ease: Expo.easeOut }, 0 );
        minimapAnimation.fromTo( minimapSpiral, 2, { pixi:{ rotation: 90 }}, { pixi:{ rotation: 450 }, ease: Expo.easeOut}, 0 );
        minimapAnimation.fromTo( minimapSpiral, 0.1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, immediateRender: false, ease: Linear.easeNone }, 0 );
        minimapAnimation.fromTo( minimapSpiral, 0.75, { pixi:{ alpha: 1 }}, { pixi:{ alpha: 0 }, immediateRender: false, ease: Linear.easeNone }, 0.2 );
        minimapAnimation.fromTo( minimapMaskGradient, 2, { pixi:{ alpha: 1 }}, { pixi:{ alpha: 0 }, ease: Linear.easeNone }, 0.5 );
        minimapAnimation.fromTo( minimapBlipsGroup, 0.65, { pixi:{ scale: 0 }}, { pixi:{ scale: 1 }, ease: Expo.easeOut}, 0);
        minimapAnimation.fromTo( minimapBlipArray, 0.75, { pixi:{ alpha: 1 }}, { pixi:{ alpha: 0 }, ease: Linear.easeNone}, 0.5);
        minimapAnimation.fromTo( minimapSpikesGroup, 0.75, { pixi:{ scale: 0 }}, { pixi:{ scale: 1 }, ease: Expo.easeOut}, 0);
        minimapAnimation.fromTo( minimapXArray, 0.75, { pixi:{ scaleY: 1 }}, { pixi:{ scaleY: 0 }, ease: Circ.easeInOut}, 0.1);
        minimapAnimation.fromTo( minimapExtras1, 3, { pixi:{ rotation: 0 }}, { pixi:{ rotation: -360 }, ease: Expo.easeOut}, 0 );
        minimapAnimation.fromTo( minimapExtras1, 0.1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 1 }, ease: Linear.easeNone }, 0 );
        minimapAnimation.fromTo( minimapExtras1, 1, { pixi:{ alpha: 1, tint: 0xFFFFFF }}, { pixi:{ alpha: 0, tint: colorPrimary }, immediateRender: false, ease: Linear.easeNone }, 0.2 );

        minimapAnimation.fromTo( minimapExtras2, 1.5, { pixi:{ scale: 0.50 }}, { pixi:{ scale: 1.1 }, ease: Expo.easeOut}, 0 );
        minimapAnimation.fromTo( minimapExtras2, 0.1, { pixi:{ alpha: 0 }}, { pixi:{ alpha: 0.5 }, ease: Linear.easeNone }, 0 );
        minimapAnimation.fromTo( minimapExtras2, 1, { pixi:{ alpha: 0.5, tint: 0xFFFFFF }}, { pixi:{ alpha: 0, tint: colorPrimary }, immediateRender: false, ease: Linear.easeNone }, 0.2 );
        
        minimapAnimation.fromTo( minimapXArray, 1, { pixi:{ tint: 0xFFFFFF }}, { pixi:{ tint: colorPrimary }, ease: Linear.easeNone }, 0 );
        minimapAnimation.fromTo( minimapBlipArray, 1, { pixi:{ tint: 0xFFFFFF }}, { pixi:{ tint: colorPrimary }, ease: Linear.easeNone }, 0 );

        minimapAnimation.timeScale(1.5);
        minimapAnimation.play(0);
    }
    
    //TweenMax.fromTo( ".cross", 0.5, { drawSVG: "0% 100%" }, { drawSVG: "50% 50%", ease: Expo.easeOut } );
    ////TweenMax.fromTo( ".cross", 0.5, { scaleX: 0.5, scaleY: 0.5 }, { scaleX: 0, scaleY: 0, transformOrigin: 'center center', ease: Expo.easeOut } );
    ////TweenMax.fromTo( ".cross", 0.5, { autoAlpha: 1 }, { autoAlpha: 0, ease: RoughEase.ease.config({ strength: 5, points: 50 }) });
    ////TweenMax.fromTo( "#bracket-left", 2, { drawSVG: "21% 29%" }, { drawSVG: "20% 30%", ease: Expo.easeOut } );
    ////TweenMax.fromTo( "#bracket-right", 2, { drawSVG: "71% 79%" }, { drawSVG: "70% 80%", ease: Expo.easeOut } );
    
    TweenMax.fromTo( "#interactive", .25, { x: generateRandomNumber(-10, 10), y: generateRandomNumber(-10, 10) }, { x: 0, y: 0, ease: RoughEase.ease.config({ strength: 2, points: 20 }) });
    
    //TweenMax.fromTo( "#cross1", 0.5, { attr:{ x1: 150, y1: 150, x2: 850, y2: 850 } }, { attr:{ x1: 500, y1: 500, x2: 500, y2: 500 }, ease: Expo.easeOut } );
    //TweenMax.fromTo( "#cross2", 0.5, { attr:{ x1: 150, y1: 850, x2: 850, y2: 150 } }, { attr:{ x1: 500, y1: 500, x2: 500, y2: 500 }, ease: Expo.easeOut } );
    //TweenMax.fromTo( ".cross", 0.5, { autoAlpha: 1 }, { autoAlpha: 0, ease: RoughEase.ease.config({ strength: 5, points: 50 }) });
    
    
    var glitcherAnimation =  new TimelineMax({ paused: true, force3D: true});
    glitcherAnimation.set( "#glitcher", { autoAlpha: 1, display: "block" });
    glitcherAnimation.fromTo( $('#glitcher'), 0.25,{ 
        x: generateRandomNumber(-15,15), y: generateRandomNumber(-15,15) }, { 
        x: 0, y: 0, ease: RoughEase.ease.config({ strength: 5, points: 50 }) }, 0 );
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "25%", height: 15, autoAlpha: 1, ease: Linear.easeNone }, 0 );  //, autoAlpha: (generateRandomNumber(25,100)/100)
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "25%", height: 8, ease: Linear.easeNone }, .05 );
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "10%", height: 5, ease: Linear.easeNone }, .1 );
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "15%", height: 5, ease: Linear.easeNone }, .15 );
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "35%", height: 1, ease: Linear.easeNone }, .2 );
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "10%", height: 8, ease: Linear.easeNone }, .25 );
    glitcherAnimation.set( $('#glitcher .minibar'), { 
        left: generateRandomNumber(0,90) + "%", 
        top: generateRandomNumber(0,90) +"%", 
        width: "25%", height: 8, ease: Linear.easeNone }, .3 );
    glitcherAnimation.set( $('#glitcher .minibar'), { autoAlpha: 0 }, .35 );
    //glitcherAnimation.set( "#glitcher .microtext", { autoAlpha: 0, display: "none", immediateRender: false }, 1);
    glitcherAnimation.set( "#glitcher", { autoAlpha: 0, display: "none", immediateRender: false }, 1);
    
    glitcherAnimation.timeScale(1.5);
    glitcherAnimation.play(0);
    
    generateExplosion();
}

// GENERATE RANDOM NUMBER
function generateRandomNumber(min, max) {
    var random = Math.floor(Math.random() * (max - min + 1)) + min;   
    return random;
}	

// RESIZE CODE
function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize( width, height );
}

// MOUSE WHEEL AND MOVEMENT
function onMouseWheel(event) {
    event.preventDefault();
    targetCameraZ -= event.wheelDeltaY * 0.05;
}

function onDocumentMouseDown( event ) {
    if ( isGlobeEventsEnabled === false ) return;
    event.preventDefault();
    isMouseDown = true;
    
    mouseXOnMouseDown = event.clientX - windowHalfX;
    mouseYOnMouseDown = event.clientY - windowHalfY;
    
    targetRotationXOnMouseDown = targetRotationX;
    targetRotationYOnMouseDown = targetRotationY;
    
    checkClick();
    
    initMouseX = event.clientX;
}

var targetTiltX = 0;
var targetTiltY = 0;

function onDocumentMouseMove( event ) {
    if ( isGlobeEventsEnabled === false ) return;
    isMouseMoved = true;
    clientMouseX = event.clientX;
    clientMouseY = event.clientY;
    
    if (isParticleHit) {
        
        if (clientMouseX > (window.innerWidth - 250)) {
            TweenMax.set( "#tooltip", { left: 'auto', right: (window.innerWidth - clientMouseX) + 35, top: clientMouseY });
        } else {
            TweenMax.set( "#tooltip", { right: 'auto', left: clientMouseX + 35, top: clientMouseY });
        }
    }
    
    if (isMediaHit) {
        
        if (clientMouseX > (window.innerWidth - 250)) {
            TweenMax.set( "#tooltip", { left: 'auto', right: (window.innerWidth - clientMouseX) + 35, top: clientMouseY });
        } else {
            TweenMax.set( "#tooltip", { right: 'auto', left: clientMouseX + 35, top: clientMouseY });
        }
    }
    
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    if (isMouseDown) {
        isGlobeRotated = true;
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
        targetRotationX = targetRotationXOnMouseDown + ( mouseY - mouseYOnMouseDown ) * 0.0025;
        targetRotationY = targetRotationYOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.0025;
    } 
    
    var centerX = window.innerWidth * 0.5;
    var centerY = window.innerHeight * 0.5;
    targetTiltY = (event.clientX - centerX) / centerX * 0.005;
    targetTiltX = (event.clientY - centerY) / centerY * 0.01;
}

function onDocumentMouseUp( event ) {
    if ( isGlobeEventsEnabled === false ) return;
    event.preventDefault();
    isMouseDown = false;
    if (Math.abs(initMouseX - event.clientX) < 25) return;
    setCameraDirection(initMouseX, event.clientX);
}

function onDocumentMouseLeave( event ) {
    if ( isGlobeEventsEnabled === false ) return;
    event.preventDefault();
    if (isMouseDown) {
        isMouseDown = false;
        if (Math.abs(initMouseX - event.clientX) < 25) return;
        setCameraDirection(initMouseX, event.clientX);
    }
}

function setCameraDirection(startX, endX) {
    if (startX > endX ) {
        cameraDirection = "right";
    } else {
        cameraDirection = "left";
    }
}


// TOUCH
var _touchZoomDistanceStart,
    _touchZoomDistanceEnd;
function onDocumentTouchStart( event ) {
    if ( isGlobeEventsEnabled === false ) return;
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        isMouseDown = true;
        
        mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
        mouseYOnMouseDown = event.touches[ 0 ].pageY - windowHalfY;
        
        targetRotationXOnMouseDown = targetRotationX;
        targetRotationYOnMouseDown = targetRotationY;
    }
    
    if ( event.touches.length > 1 ) {
        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
    }
}

function onDocumentTouchMove( event ) {
    if ( isGlobeEventsEnabled === false ) return;
    if ( event.touches.length == 1 ) {
        event.preventDefault();
        if (isMouseDown) {
            isGlobeRotated = true;
            mouseX = mouseX = event.touches[ 0 ].pageX - windowHalfX;
            mouseY = mouseY = event.touches[ 0 ].pageY - windowHalfY;
            targetRotationX = targetRotationXOnMouseDown + ( mouseY - mouseYOnMouseDown ) * 0.01;
            targetRotationY = targetRotationYOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.01;
        }
        //lastTouchX = event.clientX = event.touches[0].clientX;
        //lastTouchY = event.clientY = event.touches[0].clientY;
    }
    
    if ( event.touches.length > 1 ) {
       var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
       var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
       _touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

        var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
        if (_touchZoomDistanceEnd > _touchZoomDistanceStart) {
            targetCameraZ -= factor;
        } else {
            targetCameraZ += factor;
        }
        _touchZoomDistanceStart = _touchZoomDistanceEnd;
    }
}

function onDocumentTouchEnd( event ) {
    _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
    //isMouseDown = false;
    //event.clientX = lastTouchX;
    //event.clientY = lastTouchY;
    onDocumentMouseUp(event);
}



// MAP DATA
// NUMBER, BOOK TYPE, LAT, LON, LOCATION
var dataMap = [
    // SHOPIFY
    [0,0,33.58,-117.62,"Orange County, CA, USA"],
    [1,0,43.45,-80.56,"Waterloo, ON, Canada"],
    [2,0,59.94,10.66,"Oslo, Norway"],
    [3,0,47.53,-121.85,"Snoqualmie, WA, USA"],
    [4,0,59.37,24.71,"Jalaka, Estonia"],
    [5,0,45.24,19.82,"Cernisevskog, Serbia"],
    [6,0,37.87,-122.27,"Berkeley, CA, USA"],
    [7,0,50.74,3.59,"Ronse, Belgium"],
    [8,0,43.15,-79.24,"St. Catharines, ON, Canada"],
    [9,0,51.58,-0.11,"London, United Kingdom"],
    
    [10,0,32.56,-92.05,"Monroe, LA, USA"],
    [11,0,52.11,6.05,"Eerbeek, Netherlands"],
    [12,0,34.03,-84.75,"Acworth, GA, USA"],
    [13,0,37.69,-113.05,"Cedar City, UT, USA"],
    [14,0,57.72,12.03,"Göteborg, Sweden"],
    [15,0,45.52,-73.56,"Montreal, QC, Canada"],
    [16,0,37.78,-122.41,"San Francisco, CA, USA"],
    [17,0,48.86,2.44,"Montreuil, France"],
    [18,0,53.07,-1.23,"Nottingham, United Kingdom"],
    [19,0,39.15,-86.54,"Bloomington, IN, USA"],
    
    [20,0,32.94,-97.08,"Grapevine, TX, USA"],
    [21,0,48.79,9.79,"Schwäbisch Gmünd, Germany"],
    [22,0,56.96,23.60,"Jūrmala, Latvia"],
    [23,0,33.64,-117.58,"RSM, CA, USA"],
    [24,0,39.77,-105.07,"Wheat Ridge, CO, USA"],
    [25,0,37.78,-122.43,"San Francisco, CA, USA"],
    [26,0,51.49,4.28,"London, Netherlands"],
    [27,0,-6.96,107.55,"Bandung, Indonesia"],
    [28,0,52.33,6.65,"Almelo, Netherlands"],
    [29,0,29.55,-98.38,"San Antonio, TX, USA"],
    
    [30,0,55.72,12.51,"Søborg, Denmark"],
    [31,0,40.67,-73.66,"Malverne, NY, USA"],
    [32,0,31.27,121.48,"Shanghai, China"],
    [33,0,34.62,135.59,"Osaka, Japan"],
    [34,0,41.48,-73.04,"Naugatuck, CT, USA"],
    [35,0,-23.57,-46.62,"São Paulo, Brazil"],
    [36,0,48.44,-123.34,"Victoria, BC, Canada"],
    [37,0,33.56,-117.24,"Murrieta, CA, USA"],
    [38,0,51.04,3.75,"Gent, Belgium"],
    [39,0,37.78,-122.41,"San Francisco, CA, USA"],
    
    [40,0,59.27,18.04,"Enskede, Sweden"],
    [41,0,-33.41,151.44,"Wamberal, ACT, Australia"],
    [42,0,33.77,-117.97,"Garden Grove, CA, USA"],
    [43,0,-36.88,174.80,"Remuera, AUK, New Zealand"],
    [44,0,39.95,-75.20,"Philadelphia, PA, USA"],
    [45,0,33.73,-117.76,"Irvine, CA, USA"],
    [46,0,37.75,-122.43,"San Francisco, CA, USA"],
    [47,0,35.74,-86.90,"Spring Hill, TN, USA"],
    [48,0,37.79,-122.39,"San Francisco, CA, USA"],
    [49,0,41.09,-73.59,"Stamford, CT, USA"],
    
    [50,0,41.04,-75.93,"Drums PA, USA"],
    [51,0,33.61,-112.14,"Phoenix, AZ, USA"],
    [52,0,45.27,19.83,"Novi Sad, Serbia"],
    [53,0,46.73,-117.18,"Pullman, WA, USA"],
    [54,0,47.96,21.72,"Nyiregyhaza, Hungary"],
    [55,0,36.52,-5.04,"Málaga, Spain"],
    [56,0,47.69,8.64,"Schaffhausen, Switzerland"],
    [57,0,32.66,-116.99,"Chula Vista, CA, USA"],
    [58,0,33.64,-117.75,"Irvine, CA, USA"],
    [59,0,32.76,-117.08,"San Diego, CA, USA"],
    
    [60,0,43.47,-110.78,"Jackson, WY, USA"],
    [61,0,41.69,-93.64,"Ankeny, IA, USA"],
    [62,0,52.53,13.39," Berlin, Germany"],
    [63,0,40.46,-79.96,"Pittsburgh, PA, USA"],
    [64,0,37.27,-121.84,"San Jose, CA, USA"],
    [65,0,50.46,4.87,"Namur, Belgium"],
    [66,0,41.39,2.14,"Barcelona, Spain"],
    [67,0,55.70,12.55,"Copenhagen, Denmark"],
    [68,0,43.63,-79.47,"Toronto, ON, Canada"],
    [69,0,47.16,27.58,"Romania, Romania"],
    
    [70,0,-37.79,144.87,"Maidstone, VIC, Australia"],
    [71,0,40.74,-73.99,"New York, NY, USA"],
    [72,0,38.76,-121.27,"Roseville, CA, USA"],
    [73,0,44.20,28.62,"Constanta, Romania"],
    [74,0,33.27,-117.11,"Escondido, CA, USA"],
    [75,0,50.92,0.47,"Battle, United Kingdom"],
    [76,0,37.32,-122.02,"Cupertino, CA, USA"],
    [77,0,40.96,-74.09,"Ridgewood, NJ, USA"],
    [78,0,40.78,-111.92,"Salt Lake City, UT, USA"],
    [79,0,45.87,-111.16,"Belgrade, MT, USA"],
    
    [80,0,37.73,-122.39,"San Francisco, CA, USA"],
    [81,0,39.95,-75.19,"Philadelphia, PA, USA"],
    [82,0,17.51,78.31,"Hyderabad, India"],
    [83,0,24.80,-107.43,"Culiacán, Mexico"],
    [84,0,36.85,-76.29,"Norfolk, VA, USA"],
    [85,0,40.65,-73.94,"Brooklyn, NY, USA"],
    [86,0,33.90,-117.98,"La Mirada, LA, USA"],
    [87,0,50.78,-2.01,"Wimborne, United Kingdom"],
    [88,0,33.79,-118.09,"Long Beach, CA, USA"],
    [89,0,33.80,-84.41,"Atlanta, GA, USA"],
    
    [90,0,53.45,-2.35,"Manchester, United Kingdom"],
    [91,0,32.70,-117.03,"San Diego, CA, USA"],
    [92,0,53.33,-6.23,"Dublin, Ireland"],
    [93,0,55.66,12.54,"København, Denmark"],
    [94,0,40.67,-73.96,"Brooklyn, NY, USA"],
    [95,0,59.34,18.05,"Stockholm, Sweden"],
    [96,0,45.55,-122.62,"Portland, OR, USA"],
    [97,0,40.74,-73.98,"New York, NY, USA"],
    [98,0,37.74,-122.41,"San Francisco, CA, USA"],
    [99,0,51.03,-114.09,"Calgary, AB, Canada"],
    
    [100,0,36.61,-93.37,"Reeds Spring, MO, USA"],
    [101,0,-26.14,28.13,"Gauteng, South Africa"],
    [102,0,39.93,32.91,"Ankara, Turkey"],
    [103,0,14.03,-87.23,"Tegucigalpa, Honduras"],
    [104,0,39.91,-86.01,"Indianapolis, IN, USA"],
    [105,0,53.45,18.71,"Grudziadz, Poland"],
    [106,0,48.77,-122.40,"Bellingham, WA, USA"],
    [107,0,38.13,-83.89,"Owingsville, KY, USA"],
    [108,0,33.77,-118.38,"Rancho Palos Verdes, CA, USA"],
    [109,0,51.50,-0.06,"London, United Kingdom"],
    
    [110,0,37.25,-121.84,"San Jose, CA, USA"],
    [111,0,40.66,-73.92,"Brooklyn, NY, USA"],
    [112,0,29.78,-95.84,"Katy, TX, USA"],
    [113,0,29.70,-95.78,"Katy, TX, USA"],
    [114,0,47.62,-122.05,"Sammamish, WA, USA"],
    [115,0,-37.58,143.81,"Delecombe, VIC, Australia"],
    [116,0,35.95,-86.57,"Smyrna, TN, USA"],
    [117,0,51.44,-0.20,"London, United Kingdom"],
    [118,0,36.25,-5.96,"Cádiz, Spain"],
    [119,0,43.90,12.84,"Pesaro, Italy"],
    
    [120,0,48.85,2.37,"Paris, France"],
    [121,0,43.58,1.35,"Tournefeuille, France"],
    [122,0,38.91,-77.03,"Washington, DC, USA"],
    [123,0,51.29,-116.95,"Golden, BC, Canada"],
    [124,0,43.21,-79.99,"Ancaster, ON, Canada"],
    [125,0,37.80,-122.42,"San Francisco, CA, USA"],
    [126,0,32.76,-117.08,"San Diego, CA, USA"],
    [127,0,50.44,30.49,"Kiev, Ukraine"],
    [128,0,17.75,-66.06,"San Juan, PR, USA"],     //[128,0,18.40,-66.06,"San Juan PR, USA"],
    [129,0,37.84,-122.27,"Emeryville, CA, USA"],
    
    [130,0,39.68,-104.94,"Denver, CO, USA"],
    [131,0,33.10,-117.30,"Carlsbad, CA, USA"],
    [132,0,42.41,-71.07,"Medford, MA, USA"],
    [133,0,40.01,-105.22,"Boulder, CO, USA"],
    [134,0,37.76,-122.42,"San Francisco, CA, USA"],
    [135,0,-34.53,-58.46,"Buenos Aires, Argentina"],
    [136,0,47.65,-122.33,"Wallingford, WA, USA"],
    [137,0,52.34,16.88,"Luboń, Poland"],
    [138,0,34.08,-118.31,"Los Angeles, CA, USA"],
    [139,0,33.73,-117.89,"Santa Ana, CA, USA"],
    
    [140,0,50.81,-0.35,"Worthing, United Kingdom"],
    [141,0,37.73,-121.94,"San Ramon, CA, USA"],
    [142,0,37.88,-122.52,"Mill Valley, CA, USA"],
    [143,0,25.98,-80.39,"Miramar, FL, USA"],
    [144,0,40.49,-3.9,"Madrid, Spain"],
    [145,0,43.50,-79.65,"Mississauga, ON, Canada"],
    [146,0,40.48,-111.87,"Draper, UT, USA"],
    [147,0,30.47,-97.79,"Austin, TX, USA"],
    [148,0,48.15,17.11,"Bratislava, Slovakia"],
    [149,0,12.87,121.77,"Escalante City, Philippines"],
    
    [150,0,-19.94,-43.97,"Belo Horizonte, Brazil"],
    [151,0,40.84,-73.99,"Palisades Park, NJ, USA"],
    [152,0,35.16,-80.84,"Charlotte, NC, USA"],
    [153,0,28.59,-81.23,"Orlando, FL, USA"],
    [154,0,26.17,-80.18,"Oakland Park, FL, USA"],
    [155,0,43.91,20.33,"Cacak, Serbia"],
    [156,0,39.85,-86.34,"Indianapolis, IN, USA"],
    [157,0,34.12,-83.82,"Braselton, GA, USA"],
    [158,0,37.77,-122.42,"San Francisco, CA, USA"],
    [159,2,37.89,-122.11,"Lafayette, CA, USA"],
    
    [160,2,39.87,-105.07,"Westminster, CO, USA"],
    [161,2,51.02,-114.14,"Calgary, AB, Canada"],
    [162,2,30.29,-97.70,"Austin, TX, USA"],
    [163,2,43.04,-87.90,"Milwaukee, WI, USA"],
    [164,2,41.35,-72.15,"Waterford, CT, USA"],
    [165,2,55.67,12.51,"Frederiksberg, Denmark"],
    [166,0,51.49,4.28,"London, Netherlands"],		//[166,2,40.68,-74,"Brooklyn NY, USA"],
    [167,2,34.02,-118.32,"Los Angeles, CA, USA"],
    [168,2,34.11,-118.14,"South Pasadena, CA, USA"],
    [169,0,34.02,-118.45,"Santa Monica, CA, USA"],
    
    [170,2,47.62,-122.05,"Sammamish, WA, USA"],
    [171,2,37.33,-121.96,"Santa Clara, CA, USA"],
    [172,2,55.69,12.54,"Copenhagen, Denmark"],
    [173,2,33.09,-117.24,"Carlsbad, CA, USA"],			//@aidanrunner
    [174,0,-41.28,174.77,"Wellington, New Zealand"],
    [175,0,34.08,-118.37,"West Hollywood, CA, USA"],
    [176,0,40.96,-74.15,"Hawthorne, NJ, USA"],
    [177,2,42.48,-83.11,"Madison Heights, MI, USA"],
    [178,2,-25.15,27.01,"Johannesburg, South Africa"],
    [179,2,59.27,18.04,"Enskede, Sweden"],
    
    [180,2,25.79,-80.14,"Miami Beach, FL, USA"],
    [181,2,59.91,10.74,"Oslo, Norway"],
    [182,2,39.22,-94.42,"Liberty, MO, USA"],
    [183,2,20.66,-103.37,"Guadalajara, Mexico"],
    [184,2,37.68,-122.14,"San Leandro, CA, USA"],
    [185,2,40.73,-73.98,"New York, NY, USA"],
    [186,2,40.70,-73.98,"Brooklyn, NY, USA"],
    [187,2,34.10,-117.89,"Covina, CA, USA"],
    [188,2,28.69,-81.40,"Longwood, FL, USA"],
    [189,2,33.36,-111.67,"Mesa, AZ, USA"],
    
    [190,2,45.43,-122.79,"Portland, OR, USA"],
    [191,2,41.87,-87.97,"Villa Park, IL, USA"],
    [192,2,49.28,-123.09,"Vancouver, BC, Canada"],
    [193,0,34.01,-118.45,"Santa Monica, CA, USA"],
    [194,0,32.94,-117.22,"San Diego, CA, USA"],
    [195,2,50.86,4.35,"Brussels, Belgium"],				//@prz3mas
    [196,2,33.64,-117.75,"Irvine, CA, USA"],
    [197,2,43.63,-79.47,"Toronto, ON, Canada"],
    [198,2,39.62,-75.69,"Newark, DE, USA"],
    [199,2,40.77,-111.87,"Salt Lake City, UT, USA"],
    
    [200,2,37.7,-122.42,"San Francisco, CA, USA"],
    [201,0,37.51,-122.25,"Redwood City, CA, USA"],
    [202,2,33.10,-117.29,"Carlsbad, CA, USA"],
    [203,2,43.66,-79.33,"Toronto, ON, Canada"],
    [204,2,50.69,4.04,"Enghien, Belgium"],
    [205,2,33.27,-117.11,"Escondido, CA, USA"],
    [206,2,40.02,-105.26,"Boulder, CO, USA"],
    [207,2,40.16,-105.12,"Longmont, CO, USA"],
    [208,2,42.08,-88.32,"Sleepy Hollow, IL, USA"],
    [209,2,32.83,-117.07,"San Diego, CA, USA"],
    
    [210,0,49.26,-123.13,"Vancouver, BC, Canada"],
    [211,0,35.20,-80.84,"Charlotte, NC, USA"],
    [212,2,43.04,-87.90,"Milwaukee, WI, USA"],
    [213,2,33.71,-118.02,"Huntington Beach, CA, USA"],
    [214,2,51.60,0.64,"Hockley, United Kingdom"],			//@dbfxstudio
    [215,2,34.05,-117.27,"San Bernardino, CA, USA"],
    [216,2,40.31,-111.90,"Saratoga Springs, UT, USA"],
    [217,2,37.77,-122.39,"San Francisco, CA, USA"],
    [218,2,33.60,-117.91,"Newport Beach, CA, USA"],
    [219,2,29.55,-98.38,"San Antonio, TX, USA"],
    
    [220,2,39.76,-105.03,"Denver, CO, USA"],
    [221,2,37.25,-121.92,"San Jose, CA, USA"],
    [222,2,47.65,-122.33,"Seattle, WA, USA"],
    [223,2,34.10,-118.30,"Los Angeles, CA, USA"],
    [224,0,47.07,15.43,"Graz, Austria"],
    [225,0,40.73,-111.86,"Salt Lake City, UT, USA"],
    [226,0,33.19,-117.25,"Vista, CA, USA"],
    [227,0,35.96,-78.69,"Raleigh, NC, USA"],
    [228,0,34.10,-117.75,"Pomona, CA, USA"],
    [229,0,52.50,13.46,"Berlin, Germany"],
    
    [230,0,-33.96,151.02,"Padstow, NSW, Australia"],
    [231,0,33.70,-117.89,"Santa Ana, CA, USA"],
    [232,0,33.95,-118.45,"Playa del Rey, CA, USA"],
    [233,0,60.16,24.87,"Helsinki, Finland"],
    [234,0,48.20,16.34,"Wien, Austria"],
    [235,0,43.53,-80.29,"Guelph, ON, Canada"],
    [236,0,38.69,-9.30,"Lisbon, Portugal"],
    [237,0,22.27,114.18,"Hong Kong, China"],
    [238,0,56.74,54.16,"Chaikovsky, Russia"],
    [239,0,41.95,-88.12,"Bloomingdale, IL, USA"],
    
    [240,0,28.63,77.07,"New Delhi, India"],
    [241,0,55.74,37.35,"Moscow, Russia"],
    [242,0,43.21,-8.68,"Coruna, Spain"],
    [243,0,43.53,-80.26,"Guelph, ON, Canada"],
    [244,0,25.65,-100.29,"Contry, Mexico"],
    [245,0,40.54,-111.82,"Sandy, UT, USA"],
    [245,0,33.13,-117.27,"Carlsbad, CA, USA"],
    [248,0,45.41,-75.70,"Ottawa, ON, Canada"],
    [248,0,45.41,-75.70,"Carlsbad, CA, USA"],
    [249,0,43.65,-79.37,"Toronto, ON, Canada"],
    
    [250,0,51.19,3.19,"Brugge, Belgium"],
    [251,0,39.22,9.06,"Cagliari, Italy"],
    [252,0,41.07,14.33,"Caserta, Italy"],
    [253,0,47.74,26.64,"Botosani, Romania"],
    [254,0,51.33,-0.41,"Cobham, United Kingdom"],
    [255,0,33.64,-117.58,"RSM, CA, USA"],						//@nascro
    [256,0,-23.55,-46.43,"São Paulo, Brazil"],
    [257,0,-34.90,-56.17,"Montevideo, Uruguay"],
    [258,0,61.16,24.87,"Helsinki, Finland"],
    [259,0,33.74,-117.82,"Tustin, CA, USA"],
    
    [260,0,1.34,103.69,"Jurong West, Singapore"],
    [261,0,28.41,77.11,"Sector 58, India"],
    [262,0,43.34,-80.32,"Cambridge, ON, Canada"],
    [263,0,54.97,-1.40,"South Shields, United Kingdom"],
    [264,0,26.05,-97.64,"San Benito, TX, USA"],
    [265,0,40.11,-8.50,"Condeixa, Portugal"],
    [266,0,53.21,5.80,"Leeuwarden, Netherlands"],
    [267,0,33.56,-84.61,"Fairburn, GA, USA"],
    [268,0,51.12,17.02,"Wrocław, Poland"],
    [269,0,51.42,-0.09,"London, United Kingdom"],
    
    [270,0,59.92,10.73,"Oslo, Norway"],
    [271,0,45.61,-122.49,"Vancouver, WA, USA"],
    [272,0,48.81,2.35,"Le Kremlin-Bicêtre, France"],
    [273,0,21.00,-157.61,"Honolulu, HI, USA"],
    [274,0,42.65,21.17,"Prishtine, Albania"],
    [275,0,46.62,-0.92,"La Caillère-Saint-Hilaire, France"],
    [276,0,51.07,17.00,"Wrocław, Poland"],
    [277,0,-31.82,115.75,"Sorrento, WA, Australia"],
    [278,0,46.75,23.59,"Cluj, Romania"],
    [279,0,57.66,12.94,"Borås, Sweden"],
    
    [280,0,45.48,-75.81,"Chelsea, QC, Canada"],
    [281,0,40.24,-111.67,"Provo, UT, USA"],
    [282,0,-33.78,151.24,"Seaforth, NSW, Australia"],
    [283,0,32.51,-85.01,"Phenix City, AL, USA"],
    [284,0,37.40,127.07,"Seongnam-si, South Korea"],
    [285,0,29.66,-95.51,"Houston, TX, USA"],
    [286,0,42.36,-71.12,"Cambridge, MA, USA"],
    [287,0,4.90,-73.94,"Sopó, Colombia"],
    [288,0,34.06,-118.29,"Los Angeles, CA, USA"],
    [289,0,47.48,8.69,"Winterthur, Switzerland"],
    
    [290,0,26.01,-80.35,"Pembroke Pines, FL, USA"],
    [291,0,32.83,-117.21,"San Diego, CA, USA"],
    [292,0,33.71,-117.78,"Irvine, CA, USA"],
    [293,0,43.75,-79.45,"Toronto, ON, Canada"],
    [294,0,36.73,10.29,"Bou Mhel el-Bassatine, Tunisia"],
    [295,0,39.39,-76.81,"Owings Mills, MD, USA"],
    [296,0,51.41,21.96,"Puławy, Poland"],
    [297,0,51.52,-0.11,"London, United Kingdom"],
    [298,0,-27.56,152.95,"Darra, QLD, Australia"],
    [299,0,47.39,8.53,"Zürich, Switzerland"],
    
    [300,0,35.95,-86.80,"Franklin, TN, USA"],
    [301,0,38.88,-77.07,"Arlington, VA, USA"],
    [302,0,38.81,-9.16,"Lisbon, Portugal"],
    [303,0,47.45,7.74,"Bubendorf, Switzerland"],
    [304,0,-34.78,-58.41,"Buenos Aires, Argentina"],
    [305,0,50.73,-1.85,"Bournemouth, United Kingdom"],
    [306,0,31.88,116.01,"Midland, WA, Australia"],
    [307,0,-26.19,28.00,"Johannesburg, South Africa"],
    [308,0,37.50,-122.20,"Redwood City, CA, USA"],
    [309,0,-38.14,145.15,"Frankston, VIC, Australia"],
    
    [310,0,39.57,2.64,"Palma, Balearic Islands, Spain"],
    [311,0,59.72,10.81,"Ski, Norway"],
    [312,0,46.57,15.66,"Maribor, Slovenia"],
    [313,0,44.66,-63.60,"Halifax, NS, Canada"],
    [314,0,46.36,15.39,"Zreče, Slovenia"],
    [315,0,45.52,-122.97,"Hillsboro, OR, USA"],
    [316,0,50.55,7.22,"Sinzig, Germany"],
    [317,0,40.75,-73.96,"New York, NY, USA"],
    [318,0,37.80,-122.41,"San Francisco, CA, USA"],
    [319,0,45.39,12.35,"Lido Venezia, Italy"],

    [320,0,-25.47,-49.28,"Curitiba, Brazil"],
    [321,0,52.38,4.92,"Amsterdam, Netherlands"],
    [322,0,53.28,-9.05,"Galway, Ireland"],
    [323,0,50.07,14.42,"Praha, Czech Republic"],
    [324,0,44.32,-120.81,"Prineville, OR, USA"],
    [325,0,38.21,-85.66,"Louisville, KY, USA"],
    [326,0,34.05,-117.93,"West Covina, CA, USA"], 
    [327,0,53.20,6.56,"Groningen, Netherlands"],
    [328,0,45.45,-122.76,"Portland, OR, USA"],
    [329,0,51.43,0.17,"Dartford, United Kingdom"],
    
    [330,0,58.39,15.63,"Linköping, Sweden"],
    [331,0,51.12,4.28,"Rupelmonde, Belgium"],
    [332,0,37.78,-122.43,"San Francisco, CA, USA"],
    [333,0,55.78,37.58,"Moscow, Russia"],
    [334,0,43.61,-79.62,"Mississauga, ON, Canada"],
    [335,0,1.34,103.86,"The Scala, Singapore"],
    [336,0,38.81,-77.05,"Alexandria, VA, USA"], 
    [337,0,40.69,-73.99,"Brooklyn, NY, USA"],
    [338,0,-33.91,151.05,"Punchbowl, NSW, Australia"],
    [339,0,47.37,8.52,"Zurich, Switzerland"],
    
    [340,0,55.69,12.54,"Copenhagen, Denmark"],
    [341,0,37.42,-122.13,"Palo Alto, CA, USA"],
    [342,0,0-22.92,-43.26,"Rio de Janeiro, Brazil"],
    [343,0,52.31,4.95,"Amsterdam, Netherlands"],
    [344,0,50.05,19.95,"Kraków, Poland"],
    [345,0,41.06,-73.52,"Stamford, CT, USA"],
    [346,0,52.20,21.00,"Warszawa, Poland"], 
    [347,0,51.53,-0.34,"Greenford, United Kingdom"],
    [348,0,33.65,-117.87,"Newport Beach, CA, USA"],
    [349,0,-33.66,-70.74,"Santiago, Chile"],
    
    [350,0,51.43,-0.04,"Sydenham, United Kingdom"],
    [351,0,44.86,-0.62,"Bordeaux, France"],
    [352,0,53.39,22.77,"Mońki, Poland"],
    [353,0,43.04,141.31,"Hokkaido, Japan"],
    [354,0,59.62,17.72,"Sigtuna, Sweden"],
    [355,0,48.77,18.62,"Prievidza, Slovakia"],
    [356,0,56.014,-3.80,"Falkirk, United Kingdom"], 
    [357,0,44.50,11.82,"Conselice, Italy"],
    [358,0,25.78,-80.30,"Miami, FL, USA"],
    [359,0,52.38,4.87,"Amsterdam, Netherlands"],
    
    [360,0,28.91,-81.29,"Debary, FL, USA"],
    [361,0,45.85,-72.50,"Drummondville, QC, Canada"],
    [362,0,53.49,-2.28,"Salford, United Kingdom"],
    [363,0,48.87,2.38,"Paris, France"], 
    [364,0,35.92,14.49,"Saint Julian's, Malta"],
    [365,0,-24.71,28.39,"Modimolle, South Africa"],
    [366,0,32.05,34.78,"Tel Aviv, Israel"], 
    [367,0,32.10,34.73,"Tel Aviv, Israel"],
    [368,0,41.07,28.78,"Istanbul, Turkey"],
    [369,0,39.92,116.56,"Beijing, China"],
    
    [370,0,40.48,-3.70,"Madrid, Spain"],
    [371,0,0-1.30,36.77,"Nairobi, Kenya"],
    [372,0,50.38,30.78,"Kiev, Ukraine"],
    [373,0,39.98,-75.14,"Philadelphia, PA, USA"],
    [374,0,45.11,21.24,"Vrsac, Serbia"],
    [375,0,43.708,-79.39,"Toronto, ON, Canada"],
    [376,0,47.61,-122.35,"Seattle, WA, USA"], 
    [377,0,46.17,-1.16,"Lagord, France"],
    [378,0,4.67,-74.11,"Bogota, Colombia"],
    [379,0,49.29,-123.14,"Vancouver, BC, Canada"],
    
    [380,0,51.49,-0.02,"London, United Kingdom"],
    [381,0,46.349,16.35,"Puscine, Croatia"],
    [382,0,32.03,34.77,"Holon, Israel"],
    [383,0,55.07,-1.52,"Seaton Delaval, United Kingdom"],
    [384,0,48.06,-0.76,"Laval, France"],
    [385,0,-33.86,151.20,"Sydney, NSW, Australia"],
    [386,0,-27.55,152.93,"Mount Ommaney, QLD, Australia"], 
    [387,0,41.02,-74.37,"West Milford, NJ, USA"],
    [388,0,43.71,-79.78,"Brampton, ON, Canada"],
    [389,0,48.06,-0.76,"Laval, France"],
    
    [390,0,53.67,-1.56,"Ossett, United Kingdom"],
    [391,0,34.14,-118.47,"Sherman Oaks, CA, USA"],
    [392,0,39.95,-75.17,"Philadelphia, PA, USA"],
    [393,2,45.27,19.81,"Novi Sad, Serbia"],
    [394,0,41.68,-81.37,"Mentor, OH, USA"],
    [395,2,39.54,-119.85,"Reno, NV, USA"],
    [396,2,41.70,-93.64,"Ankeny, IA, USA"], 
    [397,2,45.57,5.91,"Chambéry, France"],
    [398,0,46.07,-64.75,"Riverview, NB, Canada"],
    [399,2,28.15,-82.27,"Tampa, FL, USA"],						// Aaron Greenlee
    
    [400,0,47.84,12.08,"Rosenheim, Germany"],
    [401,0,51.64,-0.14,"London, United Kingdom"],
    [402,2,45.45,4.39,"Saint-Étienne, France"],
    [403,2,44.75,-79.88,"Midland ON, Canada"],
    [404,2,33.91,-86.01,"Gadsden AL, USA"],
    [405,0,48.43,-89.23,"Thunder Bay, ON, Canada"],
    [406,2,39.69,-84.13,"Kettering, OH, USA"], 
    [407,0,51.40,-0.26,"New Malden, United Kingdom"],
    [408,0,41.87,-87.64,"Chicago, IL, USA"],
    [409,0,41.00,28.73,"Istanbul, Turkey"],
    
    [410,0,54.99,-6.87,"Limavady, United Kingdom"],
    [411,0,47.61,-122.33,"Seattle, WA, USA"],
    [412,0,45.02,7.79,"Chieri, Italy"],
    [413,0,35.18,-97.42,"Norman, OK, USA"],
    [414,0,45.50,-122.92,"Hillsboro, OR, USA"],
    [415,0,28.54,-81.36,"Orlando, FL, USA"],
    [416,0,42.46,-71.06,"Melrose, MA, USA"], 
    [417,2,-35.20,173.92,"Kerikeri, New Zealand"],				//@ericjordan
    // DELETED TEST ORDER
    [419,2,52.06,-0.08,"Litlington, United Kingdom"],			//@thefwa
    [420,2,43.22,-79.98,"Ancaster, ON, Canada"],				//@synergyseekers
    
    [421,0,1.35,103.93,"Singpaore, Singpaore"],
    [422,2,46.82,-92.06,"Duluth, MN, USA"],
    [423,0,52.05,1.17,"Ipswich, United Kingdom"],
    [424,0,40.71,-74.28,"Union, NJ, USA"],
    [425,0,-29.78,31.02,"Durban, South Africa"],
    [426,0,43.88,-79.31,"Markham, ON, Canada"], 
    [427,0,33.81,-116.45,"Cathedral City, CA, USA"],
    [428,0,-37.8713221,144.99,"Balaclava, VIC, Australia"],
    [429,0,36.15,-115.32,"Las Vegas, NV, USA"],
    
    [430,0,52.37,4.87,"Amsterdam, Netherlands"],
    [431,0,45.76,4.78,"Tassin la Demi Lune, France"],
    [432,0,50.61,3.04,"Lille, France"],
    [433,0,48.86,9.24,"Remseck, Germany"],
    [434,0,34.00,-118.45,"Venice, CA, USA"],
    
    /*
    [435,0,0,0,""],
    [436,0,0,0,""], 
    [437,0,0,0,""],
    [438,0,0,0,""],
    [439,0,0,0,""],
    
    [410,0,0,0,""],
    [411,0,0,0,""],
    [412,0,0,0,""],
    [413,0,0,0,""],
    [414,0,0,0,""],
    [415,0,0,0,""],
    [416,0,0,0,""], 
    [417,0,0,0,""],
    [418,0,0,0,""],
    [419,0,0,0,""],
    */
    
    // AMAZON UK - 50 / 359 - 2017-10-26
    [500,1,50.79,-2.60,"Dorset, United Kingdom"],						//@mikebeecham
    // AMAZON UK FILLED
    [500,1,52.54,1.26,"Norwich, United Kingdom"],
    [600,1,51.52,-0.24,"London, United Kingdom"],
    [600,1,51.55,-0.24,"London, United Kingdom"],
    [600,1,51.58,-0.24,"London, United Kingdom"],
    [600,1,51.61,-0.24,"London, United Kingdom"],
    [600,1,51.52,-0.24,"London, United Kingdom"],
    [600,1,51.49,-0.24,"London, United Kingdom"],
    [600,1,51.52,-0.37,"London, United Kingdom"],
    [600,1,51.49,-0.37,"London, United Kingdom"],
    [600,1,51.61,-0.37,"London, United Kingdom"],
    [600,1,51.58,-0.37,"London, United Kingdom"],
    [600,1,51.55,-0.37,"London, United Kingdom"],
    [600,1,51.55,-0.20,"London, United Kingdom"],
    [600,1,51.58,-0.20,"London, United Kingdom"],
    [600,1,51.61,-0.20,"London, United Kingdom"],
    [600,1,51.52,-0.20,"London, United Kingdom"],
    [600,1,51.50,-0.04,"London, United Kingdom"],
    [600,1,51.47,-0.06,"London, United Kingdom"],
    [600,1,51.47,-0.01,"London, United Kingdom"],
    [600,1,51.54,0.05,"London, United Kingdom"],
    [600,1,51.57,0.04,"London, United Kingdom"],
    [600,1,51.56,-0.12,"London, United Kingdom"],
    [600,1,51.51,-0.18,"London, United Kingdom"],
    [600,1,51.51,-0.27,"London, United Kingdom"],
    [600,1,51.58,-0.18,"London, United Kingdom"],
    [600,1,51.52,-0.24,"London, United Kingdom"],
    [600,1,51.44,-0.05,"London, United Kingdom"],
    [600,1,51.50,-0.042,"London, United Kingdom"],
    [600,1,51.43,-0.38,"London, United Kingdom"],
    [500,1,50.83,-0.14,"Brighton, United Kingdom"],
    [600,1,51.44,-0.36,"Twickenham, United Kingdom"],
    [600,1,53.22,-4.16,"Bangor, United Kingdom"],
    [600,1,52.47,-1.93,"Birmingham, United Kingdom"],
    [600,1,53.41,-2.98,"Liverpool, United Kindom"],
    [600,1,53.80,-1.60,"Leeds, United Kingdom"],
    [600,1,51.50,-3.23,"Cardiff, United Kingdom"],
    [600,1,51.46,-2.66,"Bristol, United Kindom"],
    [600,1,55.85,-4.30,"Glasgow, United Kingdom"],
    [600,1,55.94,-3.27,"Edinburgh, United Kingdom"],
    [600,1,53.47,-2.29,"Manchester, United Kingdom"],
    [500,1,54.59,-5.99,"Belfast, Northern Ireland"],
    [600,1,50.91,-1.43,"Southampton, United Kingdom"],
    [600,1,50.83,-0.14,"Brighton, United Kingdom"],
    [600,1,50.38,-4.14,"Plymouth, United Kingdom"],
    [600,1,52.19,0.08,"Cambridge, United Kingdom"],
    [600,1,51.27,1.06,"Canterbury, United Kingdom"],
    [600,1,51.38,-2.39,"Bath, United Kingdom"],
    [600,1,51.45,-1.03,"Reading, United Kingdom"],
    [600,1,52.96,-1.49,"East Midlands, United Kingdom"],
    
    // AMAZON EUROPE - 41 / 359 - 2017-07-19
    [500,1,23.27,113.18,"Hong Kong, China"],				//JeffLung
    [500,1,52.37,4.82,"Amsterdam, Netherlands"],			//@harmenstruiksma
    [500,1,50.62,5.52,"Liege, Belgium"],					//@luruke
    [500,1,51.93,4.60,"The Hague, Netherlands"],			//@david_hoogland
    [500,1,59.33,18.04,"Stockholm, Sweden"],				//@Alexhorre
    [500,1,52.38,4.66,"Haarlem, Netherlands"],				//@jun_e_jay
    [500,1,54.34,10.05,"Kiel, Germany"],					//@MAXIMILIAN_DAHL
    [500,1,53.55,9.78,"Hamburg, Germany"],					//@SmiddyBurbon
    [500,1,12.95,77.49,"Bengaluru, India"],					//@bchilakala - Kindle
    [500,1,48.85,2.27,"Paris, France"],						//@vpierrev
    [500,1,41.39,2.07,"Barcelona, Spain"],					//@bluemag
    [500,1,45.29,19.85,"Novi Sad, Serbia"],					//@Bajazetov
    [500,1,12.95,77.51,"Bengaluru, India"],					//@manpurwala
    [500,1,48.86,2.27,"Paris, France"],						//bilalkhettab
    [500,1,6.55,3.14,"Lagos, Nigeria"],						//@FlairMan_ - Kindle
    [500,1,49.87,8.58,"Darmstadt, Germany"],				//@marekIsOkay
    [500,1,36.19,-5.92,"Vejer De La Frontera, Spain"],		//@m_stratto
    [500,1,45.46,9.14,"Milan, Italy"],						//@maztheegg
    
    
    
    // AMAZON EUROPE FILLED
    [500,1,47.07,15.37,"Graz, Austria"],
    [500,1,47.10,15.40,"Graz, Austria"],
    [600,1,52.50,13.28,"Berlin, Germany"],
    [600,1,50.95,6.82,"Cologne, Germany"],
    [500,1,50.12,8.49,"Frankfurt, Germany"],
    [500,1,50.15,8.52,"Frankfurt, Germany"],
    [500,1,48.18,11.50,"Munich, Germany"],
    [500,1,48.15,11.47,"Munich, Germany"],
    [600,1,48.77,9.10,"Stuttgart, Germany"],
    [500,1,44.81,20.28,"Belgrade, Serbia"],
    [600,1,47.55,7.55,"Basel, Switzerland"],
    [500,1,46.95,7.35,"Bern, Switzerland"],
    [500,1,46.20,6.10,"Geneva, Switzerland"],
    [500,1,47.36,8.66,"Greifensee, Switzerland"],
    [500,1,46.68,7.84,"Interlaken, Switzerland"],
    [500,1,47.05,8.24,"Lucerne, Switzerland"],
    [600,1,47.35,8.70,"Uster, Switzerland"],
    [500,1,47.37,8.46,"Zurich, Switzerland"],
    [500,1,47.08,2.32,"Bourges, France"],
    [500,1,41.16,-8.65,"Porto, Portugal"],
    [500,1,47.15,8.48,"Zug, Switzlerland"],
    [500,1,47.42,9.29,"St. Galen, Switzerland"],
    [500,1,47.40,8.53,"Oerlikon, Switzerland"],
    
    
    // AMAZON AUTHOR CENTRAL - USA - 194/359
    [600,1,34.00,-118.50,"Santa Monica, CA, USA"],			//@_micahcarroll 
    [600,1,34.08,-118.41,"Beverly Hills, CA, USA"],
    [600,1,34.05,-118.42,"Century City, CA, USA"],
    [600,1,34.06,-118.45,"Westwood, CA, USA"],
    [600,1,33.98,-118.48,"Venice Beach, CA, USA"],
    [600,1,34.19,-118.40,"Hollywood, CA, USA"],
    [600,1,34.23,-118.55,"Northridge, CA, USA"],
    [600,1,34.18,-118.95,"Thousand Oaks, CA, USA"],
    [600,1,34.18,-118.20,"Pasadena, CA, USA"],
    [600,1,34.02,-118.31,"Los Angeles, CA, USA"],			//@EBMRadio
    [600,1,34.07,-118.35,"Los Angeles, CA, USA"],
    [600,1,34.30,-118.45,"Los Angeles, CA, USA"],
    [600,1,34.25,-118.40,"Los Angeles, CA, USA"],
    [600,1,34.20,-118.35,"Los Angeles, CA, USA"],
    [600,1,34.15,-118.30,"Los Angeles, CA, USA"],
    [600,1,34.10,-118.25,"Los Angeles, CA, USA"],
    [600,1,34.05,-118.20,"Los Angeles, CA, USA"],
    [600,1,34.00,-118.15,"Los Angeles, CA, USA"],
    [600,1,33.95,-118.10,"Los Angeles, CA, USA"],
    [600,1,33.00,-117.97,"Los Angeles, CA, USA"],
    [600,1,33.90,-118.05,"Los Angeles, CA, USA"],
    [600,1,33.85,-118.00,"Los Angeles, CA, USA"],
    [600,1,33.80,-117.95,"Los Angeles, CA, USA"],
    [600,1,33.75,-117.90,"Los Angeles, CA, USA"],
    [600,1,37.87,-122.33,"Berkeley, CA, USA"],
    [600,1,37.29,-121.95,"San Jose, CA, USA"],
    [600,1,37.37,-122.00,"Santa Clara, CA, USA"],
    [600,1,37.29,-122.02,"Santa Clara, CA, USA"],
    [600,1,37.39,-122.09,"Sunnyvale, CA, USA"],
    [600,1,37.41,-122.11,"Mountain View, CA, USA"],
    [600,1,37.42,-122.17,"Palo Alto, CA, USA"],
    [600,1,37.51,-122.28,"Redwood City, CA, USA"],
    [600,1,37.31,-122.07,"Cupertino, CA, USA"],
    [600,1,37.23,-121.98,"Los Gatos, CA, USA"],
    [600,1,37.79,-122.29,"Oakland, CA, USA"],
    [600,1,37.79,-122.21,"Oakland, CA, USA"],
    [600,1,37.29,-121.95,"San Jose, CA, USA"],
    [600,1,37.27,-121.82,"San Jose, CA, USA"],
    [600,1,37.73,-122.51,"San Francisco, CA USA"],
    [600,1,37.70,-122.50,"San Francisco, CA USA"],
    [600,1,37.65,-122.45,"San Francisco, CA USA"],
    [600,1,37.60,-122.40,"San Francisco, CA USA"],
    [600,1,37.55,-122.35,"San Francisco, CA USA"],
    [600,1,37.50,-122.30,"San Francisco, CA USA"],
    [600,1,37.45,-122.25,"San Francisco, CA USA"],
    [600,1,39.13,-84.61,"Cincinnati, OH, USA"],
    [600,1,39.15,-84.63,"Cincinnati, OH, USA"],
    [600,1,39.17,-84.65,"Cincinnati, OH, USA"],
    [600,1,39.16,-84.65,"Cincinnati, OH, USA"],
    [600,1,39.17,-84.87,"Cincinnati, OH, USA"],
    [600,1,39.17,-84.29,"Cincinnati, OH, USA"],
    [600,1,39.12,-84.30,"Cincinnati, OH, USA"],
    [600,1,39.22,-84.33,"Cincinnati, OH, USA"],
    [600,1,39.23,-84.39,"Cincinnati, OH, USA"],
    [600,1,39.21,-84.64,"Cincinnati, OH, USA"],
    [600,1,39.28,-84.64,"Cincinnati, OH, USA"],
    [600,1,38.93,-84.59,"Cincinnati, OH, USA"],
    [600,1,38.95,-84.27,"Cincinnati, OH, USA"],
    [600,1,39.15,-84.23,"Cincinnati, OH, USA"],
    [600,1,40.78,-112.05,"Salt Lake City, UT, USA"],		//@canvascreative
    [600,1,40.79,-111.85,"Salt Lake City, UT, USA"],
    [600,1,40.77,-111.87,"Salt Lake City, UT, USA"],
    [600,1,40.77,-111.89,"Salt Lake City, UT, USA"],
    [600,1,40.77,-111.91,"Salt Lake City, UT, USA"],
    [600,1,40.79,-111.93,"Salt Lake City, UT, USA"],
    [600,1,40.75,-111.95,"Salt Lake City, UT, USA"],
    [600,1,40.73,-111.97,"Salt Lake City, UT, USA"],
    [600,1,40.77,-111.99,"Salt Lake City, UT, USA"],
    [600,1,40.73,-111.93,"Salt Lake City, UT, USA"],
    [600,1,40.71,-111.93,"Salt Lake City, UT, USA"],
    [600,1,40.70,-74.11,"New York, NY, USA"],
    [600,1,40.70,-73.83,"New York, NY, USA"],
    [600,1,40.87,-73.92,"New York, NY, USA"],
    [600,1,40.70,-73.92,"New York, NY, USA"],
    [600,1,40.75,-73.80,"New York, NY, USA"],
    [600,1,40.80,-73.85,"New York, NY, USA"],
    [600,1,40.85,-73.90,"New York, NY, USA"],
    [600,1,40.72,-73.91,"New York, NY, USA"],
    [600,1,40.74,-73.81,"New York, NY, USA"],
    [600,1,40.76,-73.81,"New York, NY, USA"],
    [600,1,39.76,-104.99,"Denver, CO, USA"],				//@krispuckett
    [600,1,39.76,-104.96,"Denver, CO, USA"],
    [600,1,39.76,-104.93,"Denver, CO, USA"],
    [600,1,39.76,-104.90,"Denver, CO, USA"],
    [600,1,39.74,-104.96,"Denver, CO, USA"],
    [600,1,39.74,-104.93,"Denver, CO, USA"],
    [600,1,39.74,-104.90,"Denver, CO, USA"],
    [600,1,39.72,-104.96,"Denver, CO, USA"],
    [600,1,39.72,-104.93,"Denver, CO, USA"],
    [600,1,33.74,-117.66,"Silverado, CA, USA"],				// FK
    [600,1,35.08,-106.81,"Albuquerque, NM, USA"],			// FK
    [600,1,36.78,-119.93,"Fresno, CA, USA"],				// FK
    [600,1,33.75,-112.46,"Peoria, AZ, USA"],				// FK
    [600,1,33.39,-111.99,"Tempe, AZ, USA"],					// FK
    [600,1,35.18,-111.64,"Flagstaff, AZ, USA"],				// FK	
    [600,1,33.67,-111.99,"Scottsdale, AZ, USA"],			// FK
    [600,1,42.35,-71.07,"Boston, MA, USA"],
    [600,1,42.34,-71.05,"Boston, MA, USA"],
    [600,1,42.33,-71.03,"Boston, MA, USA"],
    [600,1,42.32,-71.01,"Boston, MA, USA"],
    [600,1,42.31,-71.03,"Boston, MA, USA"],
    [600,1,42.30,-71.05,"Boston, MA, USA"],
    [600,1,41.83,-87.87,"Chicago, IL, USA"],
    [600,1,41.81,-87.89,"Chicago, IL, USA"],
    [600,1,41.80,-87.91,"Chicago, IL, USA"],
    [600,1,41.79,-87.93,"Chicago, IL, USA"],
    [600,1,41.77,-87.95,"Chicago, IL, USA"],
    [600,1,41.75,-87.97,"Chicago, IL, USA"],
    [600,1,32.70,-117.05,"San Diego, CA, USA"],				//@SYLVIA38
    [600,1,32.72,-117.07,"San Diego, CA, USA"],
    [600,1,32.74,-117.09,"San Diego, CA, USA"],
    [600,1,32.70,-117.09,"San Diego, CA, USA"],
    [600,1,32.72,-117.11,"San Diego, CA, USA"],
    [600,1,32.74,-117.13,"San Diego, CA, USA"],
    [600,1,47.61,-122.41,"Seattle, WA, USA"],				//@egojab
    [600,1,47.24,-122.50,"Tacoma, WA, USA"],
    [600,1,47.24,-122.48,"Tacoma, WA, USA"],
    [600,1,47.22,-122.52,"Tacoma, WA, USA"],
    [600,1,47.22,-122.50,"Tacoma, WA, USA"],
    [600,0,38.87,-77.06,"Washington, DC, USA"],
    [600,0,38.85,-77.04,"Washington, DC, USA"],
    [600,0,38.83,-77.02,"Washington, DC, USA"],
    [600,0,38.81,-77.00,"Washington, DC, USA"],
    [600,0,38.87,-77.04,"Washington, DC, USA"],
    [600,1,33.72,-84.47,"Atlanta, GA, USA"],
    [600,1,33.74,-84.49,"Atlanta, GA, USA"],
    [600,1,33.76,-84.51,"Atlanta, GA, USA"],
    [600,1,33.78,-84.53,"Atlanta, GA, USA"],
    [600,1,30.31,-97.73,"Austin, TX, USA"],
    [600,1,30.33,-97.75,"Austin, TX, USA"],
    [600,1,30.35,-97.77,"Austin, TX, USA"],
    [600,1,30.31,-97.79,"Austin, TX, USA"],
    [600,1,25.78,-80.30,"Miami, FL, USA"],
    [600,1,25.75,-80.28,"Miami, FL, USA"],
    [600,1,25.78,-80.26,"Miami, FL, USA"],
    [600,1,25.75,-80.24,"Miami, FL, USA"],
    [600,1,40.00,-75.18,"Philadelphia, PA, USA"],
    [600,1,40.00,-75.16,"Philadelphia, PA, USA"],
    [600,1,40.00,-75.14,"Philadelphia, PA, USA"],
    [600,1,40.00,-75.12,"Philadelphia, PA, USA"],
    [600,1,35.20,-80.98,"Charlotte, NC, USA"],
    [600,1,35.22,-80.93,"Charlotte, NC, USA"],
    [600,1,35.28,-80.91,"Charlotte, NC, USA"],
    [600,1,39.98,-83.13,"Columbus, OH, USA"],
    [600,1,39.98,-83.11,"Columbus, OH, USA"],
    [600,1,39.98,-83.09,"Columbus, OH, USA"],
    [600,1,32.82,-96.87,"Dallas, TX, USA"],
    [600,1,32.80,-96.85,"Dallas, TX, USA"],
    [600,1,32.78,-96.83,"Dallas, TX, USA"],
    [600,1,41.76,-72.715,"Hartford, CT, USA"],
    [600,1,41.74,-72.713,"Hartford, CT, USA"],
    [600,1,41.72,-72.711,"Hartford, CT, USA"],
    [600,1,36.18,-87.06,"Nashville, TN, USA"],
    [600,1,36.18,-87.04,"Nashville, TN, USA"],
    [600,1,36.18,-87.02,"Nashville, TN, USA"],
    [600,1,45.54,-122.72,"Portland, OR, USA"],
    [600,1,45.52,-122.70,"Portland, OR, USA"],
    [600,1,45.50,-122.68,"Portland, OR, USA"],
    [600,1,27.95,-82.45,"Tampa, FL, USA"],					//@aarongreenlee
    [600,1,27.77,-82.74,"St. Petersberg, FL, USA"],
    [600,1,27.83,-82.63,"St. Petersberg, FL, USA"],
    [600,1,39.28,-76.69,"Baltimore, MD, USA"],
    [600,1,39.28,-76.71,"Baltimore, MD, USA"],
    [600,1,42.89,-78.92,"Buffalo, NY, USA"],
    [600,1,42.89,-78.90,"Buffalo, NY, USA"],
    [600,1,38.87,-104.89,"Colorado Springs, CO, USA"],
    [600,1,38.87,-104.89,"Colorado Springs, CO, USA"],
    [600,1,42.35,-83.23,"Detroit, MI, USA"],
    [600,1,42.33,-83.21,"Detroit, MI, USA"],
    [500,1,35.53,-82.63,"Asheville, NC, USA"],				//@vpierrev 
    [500,1,34.83,-82.39,"Greenville, SC, USA"],
    [600,1,28.39,-81.00,"Orlando, FL, USA"],
    [600,1,28.39,-81.02,"Orlando, FL, USA"],
    [600,1,38.65,-90.31,"St. Louis, MO, USA"],
    [600,1,38.65,-90.31,"St. Louis, MO, USA"],
    [600,1,36.15,-96.01,"Tulsa, OK, USA"],
    [600,1,36.15,-96.01,"Tulsa, OK, USA"],
    [600,1,26.74,-80.19,"West Palm Beach, FL, USA"],
    [600,1,27.64,-80.41,"Vero Beach, FL, USA"],
    [600,1,42.49,-90.74,"Dubuqu, IA, USA"],
    [600,1,37.99,-87.57,"Evansville, IN, USA"],
    [600,1,36.31,-119.36,"Visalia, CA, USA"],
    [600,1,42.95,-85.73,"Grand Rapids, MI, USA"],
    [600,1,39.77,-86.27,"Indianapolis, IN, USA"],
    [600,1,38.03,-84.61,"Lexington, KY, USA"],
    [600,1,38.18,-85.81,"Louisville, KY, USA"],
    [600,1,35.12,-90.11,"Memphis, TN, USA"],
    [600,1,43.05,-88.03,"Milwaukee, WI, USA"],
    [600,1,44.97,-93.33,"Minneapolis, MN, USA"],
    [600,1,35.48,-97.61,"Oklahoma City, OK, USA"],
    [600,1,33.60,-112.40,"Phoenix, AZ, USA"],
    [600,1,40.44,-79.94,"Pittsburgh, PA, USA"],
    [600,1,43.67,-70.29,"Portland, ME, USA"],
    [600,1,47.67,-117.48,"Spokane, WA, USA"],				//@typicaltechtran
    // NOT ON AUTHOR CENTRAL YET
    [600,1,38.66,-121.53,"Sacramento, CA, USA"],			//@HelloDuane
    [600,0,30.50,-97.85,"Cedar Park, TX, USA"],				//@figdigital - Kindle
    [600,1,35.66,-97.47,"Edmond, OK, USA"],					//@ryandavidk
    [600,1,35.15,-101.84,"Amarillo, TX, USA"],				//@stevebargas
    // US FILLED 
    [600,1,33.29,-111.83,"Gilbert, AZ, USA"],
    [600,1,33.66,-112.52,"Surprise, AZ, USA"],
    [600,1,37.33,-119.58,"Bass Lake, CA, USA"],
    [600,1,34.148,-117.43,"San Bernardino, CA, USA"],
    [600,1,33.50,-117.19,"Temecula, CA, USA"],
    [600,1,33.43,-117.68,"San Clemente, CA, USA"],
    [600,1,38.56,-121.58,"Sacramento, CA, USA"],
    [600,1,36.96,-120.11,"Madera, CA, USA"],
    [600,1,35.32,-119.15,"Bakersfield, CA, USA"],
    [600,1,35.27,-120.70,"San Luis Obispo, CA, USA"],
    [600,1,37.61,-119.03,"Mammoth Lakes, CA, USA"],
    [600,1,33.74,-116.43,"Palm Desert, CA, USA"],
    [600,1,33.88,-117.27,"Riverside, CA, USA"],
    [600,1,33.22,-117.38,"Oceanside, CA. USA"],
    [600,1,33.54,-117.81,"Laguna Beach, CA, USA"],
    [600,1,38.55,-121.77,"Davis, CA, USA"],
    [600,1,37.33,-119.67,"Oakhurst, CA, USA"],
    [600,1,33.36,-117.25,"Fallbrook, CA, USA"],
    [600,1,36.82,-119.71,"Clovis, CA, USA"],
    [600,1,36.59,-121.88,"Monterey, CA, USA"],
    [600,1,36.97,-122.06,"Santa Cruz, CA, USA"],
    [600,1,37.27,-107.90,"Durango, CO, USA"],
    [600,1,38.26,-104.66,"Pueblo, CO, USA"],
    [600,1,39.68,-104.82,"Aurora, CO, USA"],
    [600,1,40.55,-105.13,"Fort Collins, CO, USA"],
    [600,1,39.19,-106.85,"Aspen, CO, USA"],
    [600,1,41.29,-72.96,"New Haven, CT, USA"],
    [600,1,39.15,-75.54,"Dover, CT, USA"],
    [600,1,30.34,-81.86,"Jacksonville, FL, USA"],
    [600,1,29.68,-82.38,"Gainsville, FL, USA"],
    [600,1,30.46,-84.32,"Tallahassee, FL, USA"],
    [600,1,33.94,-83.45,"Athens, GA, USA"],
    [600,1,43.60,-116.37,"Boise, ID, USA"],
    [600,1,47.70,-116.82,"Coeur d'Alene, ID, USA"],
    [600,1,44.93,-93.14,"St. Paul, MN, USA"],
    [600,1,46.59,-112.05,"Helena, MT, USA"],
    [600,1,40.61,-73.67,"Oceanside, NY, USA"],
    [600,1,35.68,-106.05,"Santa Fe, NM, USA"],
    [600,1,36.12,-115.31,"Las Vegas, NV, USA"],
    [600,1,44.06,-121.38,"Bend, OR, USA"],
    [600,1,46.18,-123.83,"Astoria, OR, USA"],
    [600,1,40.17,-75.11,"Hatboro, PA, USA"],
    [600,1,39.75,-75.40,"Philadelphia, PA, USA"],
    [600,1,35.20,-101.87,"Amarillo, TX, USA"],
    [600,1,38.81,-77.10,"Alexandria, VA, USA"],
    // GIFT BOOKS
    [1000,1,37.78,-122.41,"San Francisco, CA, USA"],			//@dannpetty
    [1001,1,38.65,-75.09,"Bristol, PA, USA"],					//@danmall
    [1002,1,33.64,-117.58,"RSM, CA, USA"],						//@nascro
    [1003,1,37.78,-122.26,"Alameda, CA, USA"],					//@nicksloggett
    [1004,1,40.71,-74.01,"New York, NY, USA"],					//@davesnyder	//@EpicallyHarshed
    [1005,1,21.40,-157.81,"Haleiwa, HI, USA"],					//@hemeon
    [1006,1,30.46,-97.85,"Cedar Park, TX, USA"],				//@ampersandrew
    [1007,1,34.15,-118.12,"Pasadena, CA, USA"],					//@sam_trapkin
    [1008,2,47.27,-122.49,"Tacoma, WA, USA"],					// DOUG
    [1009,2,33.57,-117.23,"Murrieta, CA, USA"],					// Dave Mielke
    
    [1010,2,33.67,-117.84,"Irvine, CA, USA"],					// Bran Cirkovic
    [1011,2,33.53,-117.72,"Laguna Niguel, CA, USA"],			// Jonathan Moore
    [1012,2,42.24,-71.59,"Hopkinton, MA, USA"],					// Todd Rafferty
    [1013,2,32.72,-117.01,"Spring Valley, CA, USA"],			// Ced Funches
    [1014,2,45.50,-122.61,"Portland, OR, USA"],					// Jonathan Hooker
    [1015,2,33.62,-117.61,"RSM, CA, USA"],						// Robert Craven
    [1016,2,33.43,-117.65,"San Clemente, CA, USA"],				// Stephen Tissdale
    [1017,2,33.57,-117.74,"Aliso Viejo, CA, USA"],				// Devin & Carol
    [1018,2,33.60,-112.21,"Peoria, AZ, USA"],					// Lukas Ruebbelke
    [1019,2,33.50,-117.15,"Temecula, CA, USA"],					// Michael Harris
                                                                // NATHAN ROBERTS
];

// PHOTO DATA
// MEDIA TYPE, BOOK TYPE, LAT, LON, LOCATION, LINK
var dataMedia = [
    ["PHOTO",2,33.75,-118.00,"Las Flores, CA, USA","https://twitter.com/shanemielke/status/821813139599540227"],			//LAS FLORES	33.58,-117.63
    ["PHOTO",2,33.50,-117.70,"Irvine, CA, USA","https://twitter.com/lolozinss/status/827557029950599168"],					//LOS ANGELES	33.68,-117.80
    ["PHOTO",2,33.25,-117.50,"Huntington Beach, CA, USA","https://twitter.com/jasonwhittemore/status/830156808794705920"],	//LOS ANGELES	33.71,-118.02
    ["PHOTO",2,33.00,-117.20,"Newport Beach, CA, USA","https://twitter.com/gregchristian/status/827978438354952192"],		//LOS ANGELES	33.60,-117.92
    
    ["PHOTO",2,34.00,-118.27,"Los Angeles, CA, USA","https://twitter.com/victorbme/status/822622091333791744"],				//LOS ANGELES	34.02,-117.05
    ["PHOTO",2,33.75,-118.50,"Los Angeles, CA, USA","https://twitter.com/iJess/status/829055755663745024"],					//LOS ANGELES	33.85,-118.42
    ["PHOTO",1,33.50,-118.23,"Santa Monica, CA, USA","https://twitter.com/_micahcarroll/status/856185707101999105"],		//LOS ANGELES	34.01,-118.53
    
    ["PHOTO",2,33.25,-118.04,"Carlsbad, CA, USA","https://twitter.com/aidanrunner/status/831191865231699968"],			//SAN DIEGO	33.10,-117.29
    ["PHOTO",2,33.00,-117.75,"Escondido, CA, USA","https://www.instagram.com/p/BQ6iILqAjhY/"],								//SAN DIEGO	33.27,-117.12
    ["PHOTO",1,32.75,-117.47,"San Diego, CA, USA","https://twitter.com/SYLVIA38/status/883792407707254784"],				//SAN DIEGO	32.82, -117.38
    ["PHOTO",2,32.50,-117.18,"San Diego, CA, USA","https://twitter.com/bymattlee/status/828858960253898752"],				//SAN DIEGO	32.83,-116.5
    //["PHOTO",2,34.01,-118.53,"Santa Monica, CA, USA","https://twitter.com/_micahcarroll/status/857712586908987393"],		//DUPLICATE PERSON/LOCATION
    
    //["PHOTO",2,37.89,-122.11,"Lafayette, CA, USA","https://twitter.com/ParkerHendo/status/843532118739177472"],			//DUPLICATE PERSON/LOCATION
    ["PHOTO",2,37.75,-122.03,"Lafayette, CA, USA","https://twitter.com/ParkerHendo/status/823744638607462402"],				//SF -122.15
    ["PHOTO",2,37.80,-122.47,"San Francisco, CA, USA","https://twitter.com/mscccc/status/829143195464241153"],				//SF 37.25,-122.15
    ["VIDEO",1,37.46,-122.18,"San Francisco, CA, USA","https://twitter.com/DannPetty/status/882513242261569537"],			//SF 37.78,-122.0
    ["PHOTO",1,37.24,-121.72,"San Jose, CA, USA","https://twitter.com/AdobeXD/status/869647616044285952"],					//SF 37.25,-121.05
    
    ["PHOTO",0,38.02,-84.61,"Lexington, KY, USA","https://twitter.com/TAdamMartin/status/825575387270959108"],
    ["PHOTO",0,51.52,-0.24,"London, United Kingdom","https://twitter.com/SimeoneSergio/status/825694978093547522"],
    ["PHOTO",2,43.63,-79.47,"Toronto, ON, Canada","https://twitter.com/serjkozlov/status/826557797630353412"],
    ["PHOTO",2,59.27,18.04,"Stockholm, Sweden","https://twitter.com/mannenmedhatten/status/826793675426500610"],
    ["PHOTO",2,41.87,-87.97,"Chicago, IL, USA","https://twitter.com/designagencyhq/status/826952760738381824"],
    ["PHOTO",2,40.16,-105.13,"Boulder, CO, USA","https://twitter.com/chadtotaro/status/827199681696497664"],
    ["PHOTO",2,40.61,-89.50,"Morton, IL, USA","https://www.instagram.com/p/BTAx40mgHO7/"],
    //["PHOTO",1,33.27,-117.12,"Escondido, CA, USA","https://twitter.com/iJess/status/829083648552939522"],					// DUPLICATE PERSON/LOCATION
    ["PHOTO",2,51.60,0.64,"Hockley, United Kingdom","https://twitter.com/dbfxstudio/status/829415311204089858"],
                
    ["PHOTO",2,-25.15,27.01,"Johannesburg, South Africa","https://twitter.com/tPelmir/status/829608844212977664"],
    ["PHOTO",1,50.62,5.52,"Liege, Belgium","https://twitter.com/luruke/status/829638673306177536"],
    ["PHOTO",2,50.86,4.35,"Brussels, Belgium","https://twitter.com/prz3mas/status/829787638399897601"],
    ["VIDEO",2,55.69,12.54,"Copenhagen, Denmark","https://twitter.com/bomouridsen/status/836705854695038976"],
    ["PHOTO",1,27.95,-82.45,"Tampa, FL, USA","https://twitter.com/aarongreenlee/status/862330314793865217"],
    ["PHOTO",2,51.02,-114.14,"Calgary, AB, Canada","https://twitter.com/wearecamp/status/824362755217973248"],
    
    ["PHOTO",1,40.77,-112.06,"Salt Lake City, UT, USA","https://twitter.com/canvascreative/status/872858003237728256"],
    ["PHOTO",1,35.20,-101.87,"Amarillo, TX, USA","https://twitter.com/stevebargas/status/884863267402862592"],
    ["PHOTO",1,41.39,2.07,"Barcelona, Spain","https://twitter.com/bluemag/status/885443767544807424"],
    //["PHOTO",2,41.39,2.07,"Barcelona, Spain","https://twitter.com/bluemag/status/885566469739872257"],					// DUPLICATE PERSON/LOCATION
    ["PHOTO",1,40.71,-74.01,"New York, NY, USA","https://twitter.com/EpicallyHarshed/status/887364215677345794"],
    ["PHOTO",1,35.53,-82.63,"Asheville, NC, USA","https://twitter.com/bezierer/status/887727599518183425"],
    ["VIDEO",1,54.34,10.05,"Kiel, Germany","https://twitter.com/MAXIMILIAN_DAHL/status/887921539525615616"],
    
    //["PHOTO",1,54.34,10.05,"Kiel, Germany","https://twitter.com/MAXIMILIAN_DAHL/status/887989981226168320"],				// DUPLICATE PERSON/LOCATION
    ["PHOTO",1,35.66,-97.47,"Edmond, OK, USA","https://twitter.com/ryandavidk/status/888189473799852032"],
    ["PHOTO",1,47.67,-117.48,"Spokane, WA, USA","https://twitter.com/typicaltechtran/status/893558600882298881"],
    ["PHOTO",1,21.40,-157.81,"Haleiwa, HI, USA","https://twitter.com/hemeon/status/897582578395365379"],
    ["PHOTO",0,25.78,-80.30,"Miami, FL, USA","https://twitter.com/andresV1llegas/status/874968995560030208"],
    ["PHOTO",1,52.96,-1.49,"East Midlands, United Kingdom","https://twitter.com/Shake2L/status/913130720528359424"],
    ["PHOTO",1,49.87,8.58,"Darmstadt, Germany","https://twitter.com/marekIsOkay/status/900679750607351808"],
    ["PHOTO",1,48.86,2.27,"Paris, France","https://twitter.com/bilalkhettab/status/903209900477730816"],
    ["PHOTO",1,52.37,4.82,"Amsterdam, Netherlands","https://twitter.com/harmenstruiksma/status/903642255302516736"],
    ["PHOTO",1,12.95,77.51,"Bengaluru, India","https://twitter.com/manpurwala/status/907539696414162945"],
    
    ["PHOTO",1,6.55,3.14,"Lagos, Nigeria","https://twitter.com/FlairMan_/status/908778275979247616"],
    ["PHOTO",1,45.29,19.85,"Novi Sad, Serbia","https://twitter.com/Bajazetov/status/913432240335589382"],
    ["PHOTO",1,26.14,-80.55,"Fort Lauderdale, FL, USA","https://twitter.com/Osifer/status/924011281857830912"],
    ["PHOTO",1,26.03,-142.01,"Hawaiin Airlines, Pacific Ocean","https://twitter.com/hemeon/status/924075566751289349"],
    ["PHOTO",2,47.75,-122.33,"Wallingford, WA, USA","https://twitter.com/u10int/status/828796330512232448"],	
    ["PHOTO",1,47.50,-122.25,"Seattle, WA, USA","https://twitter.com/egojab/status/924425800555798528"],
    ["PHOTO",1,42.456,14.13,"Pescara, Italy","https://twitter.com/maztheegg/status/928967180883857410"],
    ["PHOTO",1,33.69,-117.04,"Huntington Beach, CA, USA","https://twitter.com/reidpriddy/status/932807348879421440"],
    ["PHOTO",1,37.12,-80.56,"Radford, VA, USA","https://twitter.com/kevPo/status/939601679154139136"],
    ["PHOTO",2,52.06,-0.08,"Litlington, United Kingdom","https://twitter.com/fwa/status/941005946419122182"],
    
    ["PHOTO",2,41.70,-93.64,"Ankeny, IA, USA","https://www.instagram.com/p/BctfjWWDxo-"],									// DAMON JENTREE
    ["PHOTO",2,32.51,-117.80,"Aliso Viejo, USA","https://www.instagram.com/p/BcshIUelnBW/"],								// FIVE & DONE
    ["PHOTO",2,45.57,5.90,"Chambéry, France","https://twitter.com/AriBenoist/status/941499931738755072"],
    ["PHOTO",2,39.53,-119.85,"Reno, NV, USA","https://twitter.com/stealth_hi/status/941719477804138496"],
    ["PHOTO",2,33.91,-86.01,"Gadsden, AL, USA","https://twitter.com/heyitsmederek/status/942449752872050688"],
    ["PHOTO",2,42.24,-71.59,"Hopkinton, MA, USA","https://twitter.com/webRat/status/942760171469754368"],
    ["PHOTO",2,45.51,-122.61,"Portland, OR, USA","https://twitter.com/JonathanHooker/status/942778658023907328"],
    
    /*
    ["PHOTO",2,0,0,"",""],
    ["PHOTO",1,0,0,"",""],
    */
    //
    //
    //
    //
    //
    // CODE OUT THE LOOP UNTIL READY TO ANIMATE
];

$(document).ready(initWebgl);
