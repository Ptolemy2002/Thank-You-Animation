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
		this.edgeLower = this.movementSpeed;

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
});

let breakdancer = Character.Create("images/breakdancer", "breakdancer", "background", 
	genFrameList(38, "png"), true, 1, 0, 251, "left-right", "bounce",
	0, 0, null, function() {
		this.onFrame = function(frame) {
			this.y = this.backgroundHeight - this.height - 10;
		}
	});

let groupDance = Character.Create("images/group_dance", "group-dance", "background",
	genFrameList(106, "gif"), true, 1, 280, 251, "left-right", "bounce",
	 0, 0, null, function() {
		this.onFrame = function(frame) {
			this.y = this.backgroundHeight - this.height + 10;
		}
	});

let disco_ball = Character.Create("images/disco_ball", "disco-ball", "background",
	genFrameList(5, "png"), true, 1, 270, 50, "left-right", 
	"bounce", 15, 0, null, function() {
		this.onFrame = function(frame) {
			this.x = this.backgroundWidth/2 - this.width/2;
		}
	});