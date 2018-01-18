import * as THREE from "three";
import { checkDistance ,colorMix} from '../util';
import consts,{toRAD} from "../consts";
const {
    stars:{
        maxDistance,
        minDistance,
        size,
        number
    }
} = consts

export default function createStars() {
    let starGroup1 = new THREE.Group(),
        starGroup2 = new THREE.Group(),
        starsCloud1,
        starsCloud2,
        starsBufferGeometry,
        starsMaterial,
        starsMateria2,
        starsVerticesArray=[];

        starGroup1.name="starsObject1";
        starGroup2.name="starsObject2";

        starsMaterial = new THREE.PointsMaterial({
            size: size,
            sizeAttenuation: false,
            color: "#ffffff",
            fog: true
        });
        starsMaterial.needsUpdate = true;

        starsMateria2 = new THREE.PointsMaterial({
            size: size,
            sizeAttenuation: false,
            color: "#ff0000",
            fog: true
        });
        starsMateria2.needsUpdate = true;


        for ( i = 0; i < number; i ++ ) {
            var vertex = new THREE.Vector3();
            vertex.x = Math.random() * maxDistance - minDistance/2;
            vertex.y = Math.random() * 150 - 150/2;
            vertex.z = Math.random() * maxDistance - minDistance/2;
            var tempDifference = checkDistance(new THREE.Vector3(0,0,0), vertex);
            var tempBuffer = minDistance;
            if (tempDifference < tempBuffer) {
                if (vertex.x < tempBuffer) vertex.x = tempBuffer;
                if (vertex.y < tempBuffer) vertex.y = tempBuffer;
                if (vertex.z < tempBuffer) vertex.z = tempBuffer;
            }
            starsVerticesArray.push( vertex );
        }

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
        starGroup1.add(starsCloud1);

        starsCloud2 = new THREE.Points( starsBufferGeometry, starsMateria2 );
        starsCloud2.sortParticles = true;
        starGroup2.rotation.y = Math.PI;
        starGroup2.add( starsCloud2 );

        return {
            starGroup1,
            starGroup2
        }

}