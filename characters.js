const baseWidth = 600;
const baseHeight = 360;

Character.Timer_Audio = document.querySelector("#music");
Character.Timer_Audio.volume = 0.5;
//Character.Loop_Frames = 350;

let title = Character.Create(null, "title", "background", [],
	false, 0, 300, 0, "left-right", 
	"bounce", 0, 20, null, function() {
		this.x = document.getElementById("background").clientWidth / 2;
		//Lock the animation to avoid exceptions because this is not an img element.
		this.lockAnimation = true;
		this.flipOnBounce = false;

		this.onInit = function() {
			//Restart the css animation for the element by reapplying the style
			this.elem.style.animation = "none";
			this.elem.offsetHeight; //This is necessary to update the style
			this.elem.style.animation = "";

			//Move to the center of the screen
			this.x = (this.backgroundWidth/2) - (this.width/2);
		}

		this.onRestart = function() {
			//Resume the css animation
			this.elem.style.animationPlayState = "running";
		}

		this.onStop = function() {
			//Pause the css animation for the element
			this.elem.style.animationPlayState = "paused";
		}

		this.onFrame = function(frame) {
			//Scale the element font size
			this.elem.style.fontSize = Math.min(1.5 * (this.backgroundWidth / 600), 3) + "em";
		}
});

let breakdancer = Character.Create("images/breakdancer", "breakdancer", "background", 
	genFrameList(38, "png"), true, 1, 0, 251, "left-right", "bounce",
	0, 0, null, function() {
		this.onFrame = function(frame) {
			this.width = Math.min(100 * (this.backgroundWidth / baseWidth), 200);
			this.height = Math.min(100 * (this.backgroundHeight / baseHeight), 200);
			this.y = this.backgroundHeight - this.height - 10;
		}
	}
);

let groupDance = Character.Create("images/group_dance", "group-dance", "background",
	genFrameList(106, "gif"), true, 1, 280, 251, "left-right", "bounce",
	 0, 0, null, function() {
		this.onFrame = function(frame) {
			this.width = Math.min(200 * (this.backgroundWidth / baseWidth), 400);
			this.height = Math.min(100 * (this.backgroundHeight / baseHeight), 200);
			this.y = this.backgroundHeight - this.height + 10;
			this.x = this.backgroundWidth/2 - this.width/2;
		}
	}
);

let disco_ball = Character.Create("images/disco_ball", "disco-ball", "background",
	genFrameList(5, "png"), true, 1, 270, 50, "left-right", 
	"bounce", 15, 0, null, function() {
		this.onFrame = function(frame) {
			this.width = Math.min(75 * (this.backgroundWidth / baseWidth), 125);
			this.height = Math.min(75 * (this.backgroundHeight / baseHeight), 125);
			this.x = this.backgroundWidth/2 - this.width/2;
			this.y = 50 * (this.backgroundHeight / 360);
		}
	}
);