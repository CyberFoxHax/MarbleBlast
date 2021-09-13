//TODO
//1 Support for record and playback
//2 Gravity orientation
//3 Reset Moving Platforms
//4 MBU: UltraBlast is refilled
//5 MBU: Checkpoint is actually a trigger

import { Shape } from "../shape";
import * as THREE from "three";
import { Util } from "../util";
import OIMO from "../declarations/oimo";
import { TimeState } from "../level";
import { oimo } from "oimophysics";
import { displayAlert, displayGemCount, setCenterText } from "../ui/game";
import { AudioManager } from "../audio";
import { Gem } from "./gem";

interface CheckpointGameState{
    gems: Gem[];
}

/** A triangle-shaped bumper. */
export class Checkpoint extends Shape {
    dtsPath = "shapes/pads/checkpoint.dts";
    useInstancing = true;
    inArea: number = 0;
    lastState: CheckpointGameState;
    respawning:boolean = false; // respawn will trigger the checkpoint. Let's prevent that.
    constructor() {
        super();
        
        let height = 4.8;
		let radius = 1.7;
		let transform = new THREE.Matrix4();
		transform.compose(new THREE.Vector3(0, 0, height/2 + 0.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0)), new THREE.Vector3(1, 1, 1));

		this.addCollider((scale: THREE.Vector3) => {
			// Create the finish area collision geometry
			// Using this instead of CylinderGeometry because CylinderGeometry is apparently bugged!
			// Scaling note: The actual height of the cylinder (here: the y scaling) doesn't change, it's always the same.
			let finishArea = Util.createCylinderConvexHull(radius, height/2, 64, new OIMO.Vec3(scale.x, 1, scale.y)); 

			return finishArea;
		}, () => {
			// These checks are to make sure touchFinish is only called once per contact with the collider. For it to be called again, the marble must leave the area again.
			let exit = this.inArea > 0;
			this.inArea = 2;
			if (exit) return;
            this.onCheckpointEnter();
		}, transform);
    }

    onCheckpointEnter(){
        if(this.respawning === true){
            this.respawning = false;
            return;
        }
        this.lastState = {
            gems: this.level.pickedGems.slice(0)
        };
        this.level.touchCheckpoint(this);
        displayAlert("Checkpoint!");
        AudioManager.play('missinggems.wav');
        console.log(this);
    }

    restoreGameState(){
        this.respawning = true;
        var startPosition = this.worldPosition;

        this.level.marble.body.setPosition(new OIMO.Vec3(startPosition.x, startPosition.y, startPosition.z + 3));
		this.level.marble.group.position.copy(Util.vecOimoToThree(this.level.marble.body.getPosition()));
        this.level.marble.reset();
		this.level.outOfBounds = false;
		this.level.lastPhysicsTick = null;
        this.level.maxDisplayedTime = 0;
		setCenterText('none');
        
        AudioManager.play('spawn.wav');
        
        for (let interior of this.level.interiors) interior.reset();

        var euler = new THREE.Euler().setFromQuaternion(this.worldOrientation);
        this.level.yaw = euler.x - Math.PI/2;
        //this.level.pitch = euler.y;
		this.level.pitch = 0.45;
        this.level.gemCount = this.lastState.gems.length;
        this.level.pickedGems = this.lastState.gems.slice(0);
        for (let i = 0; i < this.level.gems.length; i++) {
            const gem = this.level.gems[i];
            gem.pickedUp = false;
            gem.setOpacity(1); // Hide the gem
        }

        for (let i = 0; i < this.lastState.gems.length; i++) {
            const gem = this.lastState.gems[i];
            gem.pickedUp = true;
            gem.setOpacity(0); // Show the gem
        }
        displayGemCount(this.level.gemCount, this.level.totalGems);
    }

    tick(time: TimeState, onlyVisual: boolean) {
        if(onlyVisual) return;
		super.tick(time);
		this.inArea--;
	}
}