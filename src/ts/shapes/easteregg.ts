import { Shape } from "../shape";
import { displayAlert } from "../ui/game";

/** You can pick it up. But it doesn't do anything. */
export class EasterEgg extends Shape {
	dtsPath = "shapes/items/easteregg.dts";
	ambientRotate = true;
	collideable = false;
	pickedUp = false;

	onMarbleInside() {
		if (this.pickedUp) return;

		this.pickedUp = true;
		this.setOpacity(0); // Hide the item
        //this.level.replay.recordMarbleInside(this);
		displayAlert("You found an Easter Egg");
	}

	reset() {
		this.pickedUp = false;
		this.setOpacity(1);
	}
}