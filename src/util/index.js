import Detector from "./Detector";
import * as THREE from "three";

let deviceSettings = {
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
    deviceSettings.isiPod = navigator.userAgent.match(/iPod/i) !== null;
    deviceSettings.isiPhone = navigator.userAgent.match(/iPhone/i) !== null;
    deviceSettings.isiPad = navigator.userAgent.match(/iPad/i) !== null;
    deviceSettings.isiOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? true : false);
    deviceSettings.isIEMobile = navigator.userAgent.match(/iemobile/i) !== null;
    var p = navigator.platform.toLowerCase();
    if (deviceSettings.isIEMobile || deviceSettings.isAndroid ||
        deviceSettings.isiPad || p === 'ipad' || p === 'iphone' ||
        p === 'ipod' || p === 'android' || p === 'palm' ||
        p === 'windows phone' || p === 'blackberry' || p === 'linux armv7l') {
        deviceSettings.isMobile = true;
        document.body.classList.add("isMobile");
    } else {
        document.body.classList.add("isDesktop");
    }

    if (Detector.webgl) {
        deviceSettings.isWebGL = true;
    }
    if (deviceSettings.isAndroid || deviceSettings.isIEMobile) deviceSettings.isWebGL = false;
}

/**
 * 缓存静态图片
 * @returns {object} 返回一个Promise,所有图片加载完成的时候为resolve 
 */
function cacheImages() {
    let images = ["dot-inverted.png", "earth-glow.jpg",
        "map_inverted.png", "map.png",
        "star.jpg", "universe.jpg"
    ];

    return () => {
        let caches = images.map(v => {
            return new Promise((resolve) => {
                let _img = new Image();
                _img.src = require("../assets/" + v);
                _img.onload = () => resolve(_img);
            })
        });
        return Promise.all(caches);
    }

}

/**
 * 两个不同的颜色按照一定的比例混合,和GLSL的中的mix函数类似
 * @param {number} p  -0-1的小数
 * @param {string} c0  -16进制颜色值 例如:"#ff0000"
 * @param {string} c1 -16进制颜色值 例如:"#ff0000"
 * @returns c1 -16进制颜色值 例如:"#ff0000"
 */
function colorMix(p, c0, c1) {

    c0=c0||consts.colorPrimary;
    c1=c1||consts.colorDarken;

    var n = p < 0 ? p * -1 : p,
        u = Math.round,
        w = parseInt;
    if (c0.length > 7) {
        var f = c0.split(","),
            t = (c1 ? c1 : p < 0 ? "rgb(0,0,0)" : "rgb(255,255,255)").split(","),
            R = w(f[0].slice(4)),
            G = w(f[1]),
            B = w(f[2]);
        return "rgb(" + (u((w(t[0].slice(4)) - R) * n) + R) + "," +
            (u((w(t[1]) - G) * n) + G) + "," + (u((w(t[2]) - B) * n) + B) + ")"
    } else {
        var f = w(c0.slice(1), 16),
            t = w((c1 ? c1 : p < 0 ? "#000000" : "#FFFFFF")
                .slice(1), 16),
            R1 = f >> 16,
            G1 = f >> 8 & 0x00FF,
            B1 = f & 0x0000FF;
        return "#" + (0x1000000 + (u(((t >> 16) - R1) * n) + R1) *
            0x10000 + (u(((t >> 8 & 0x00FF) - G1) * n) + G1) * 0x100 +
            (u(((t & 0x0000FF) - B1) * n) + B1)).toString(16).slice(1)
    }
}
/**
 * 生成一个随机数
 * @param {number} min 最大值
 * @param {number} max 最小值
 * @returns {number}
 */
function generateRandomNumber(min, max) {
    var random = Math.floor(Math.random() * (max - min + 1)) + min;   
    return random;
}

/**
 * 
 * @param {object} a 
 * @param {object} b 
 * @returns 
 */
function checkDistance(a, b) {
    return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y) + (b.z - a.z) * (b.z - a.z) );
}
/**
 * 平面坐标转化为球面坐标的方法
 * @param {any} lat 
 * @param {any} lon 
 * @param {any} radius 
 * @param {any} height 
 * @returns 
 */
function latLongToVector3(lat, lon, radius, height) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;
    var x = -(radius+height) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+height) * Math.sin(phi);
    var z = (radius+height) * Math.cos(phi) * Math.sin(theta);
    return new THREE.Vector3(x,y,z);
}
/**
 * 插值函数
 * @param {number} from  fromValue
 * @param {number} to toValue 
 * @param {number} fraction 0-1之间的数字
 * @returns 
 */
function interpolation(from,to,fraction){
    return (to-from)*fraction+from;
}


export {
    deviceSettings,
    cacheImages,
    colorMix,
    generateRandomNumber,
    checkDistance,
    latLongToVector3,
    interpolation
}