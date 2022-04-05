let debug = false;

function clone(instance) {
	return Object.assign(
	  Object.create(
		// Set the prototype of the new object to the prototype of the instance.
		// Used to allow new object behave like class instance.
		Object.getPrototypeOf(instance),
	  ),
	  // Prevent shallow copies of nested structures like arrays, etc
	  JSON.parse(JSON.stringify(instance)),
	);
}

/*
	Generate a random integer between min and max, inclusive on both ends.
*/
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
	Generate a random decimal between min and max, inclusive on both ends.
	The parameter decimals is the maximum number of decimal places to generate.
*/
function randomDecimal(min, max, decimals) {
	//Convert the decimals to integers so that we can generate inclusively
	let power = Math.pow(10, decimals);
	let minAsInt = min * power;
	let maxAsInt = max * power;
	let int = randomInt(minAsInt, maxAsInt);
	//Convert the random integer back to a decimal
	int = int / power;
	//Round it to the number of decimals specified
	return Math.round(int * power) / power;
}

/*
	Create a new p element as a child of the element with the id "character-positions".
*/
function createDebugElement() {
	let character = document.createElement("p");
	document.querySelector("#character-positions").appendChild(character);
	return character;
}

class Character {
	/*
		A clone of the character that is initialized with the constructor and reset methods.
		This is used to create a copy of the character that can be used to reset the character.
	*/
	original = null;
	//The parent directory of the character frame images.
	parentDir = "images";
	//The list of individual files that make up the character animation.
	frameImgs = [];
	//Whether the animation should loop or not.
	loop = true;
	//The current frame number of the animation.
	_frameNumber = 0;
	set frameNumber(number) {
		if (!this.lockAnimation) {
			this._frameNumber = number;
		}
	}
	get frameNumber() {
		return this._frameNumber;
	}
	//The speed at which the character should traverse animation frames.
	animateSpeed = 1;
	//The id of the element that the character should be rendered to.
	elemId = null;
	//The width of the character's element
	get width() {
		this.elem.display = "block"
		let result = this.elem.clientWidth;
		if (!this.shown) this.elem.display = "none";
		return result;
	}
	set width(value) {
		this.elem.clientWidth = value + "px";
	}
	//The height of the character's element
	get height() {
		this.elem.display = "block"
		let result = this.elem.clientHeight;
		if (!this.shown) this.elem.display = "none";
		return result;
	}
	set height(height) {
		this.elem.clientHeight = height + "px";
	}
	//The id of the background element that the character should be rendered to.
	backgroundId = "background";
	//The width of the background element.
	get backgroundWidth() {
		return this.background.clientWidth;
	}
	set backgroundWidth(value) {
		this.background.style.width = value + "px";
	}
	//The height of the background element.
	get backgroundHeight() {
		return this.background.clientHeight;
	}
	set backgroundHeight(value) {
		this.background.style.height = value + "px";
	}
	//The x position of the character.
	_x = 0;
	set x(value) {
		if (!this.lockPosition) {
			this._x = value
		}
	}
	get x() {
		return this._x;
	}
	//The y position of the character.
	_y = 0;
	set y(value) {
		if (!this.lockPosition) {
			this._y = value
		}
	}
	get y() {
		return this._y;
	}
	/*
		The initial position of the character.
		If the direction is left-right, this is the x position.
		If the direction is up-down, this is the y position.
		If the direction is diagonal, this is an array of [x, y]
		Used when the edge behavior is "wrap"
	*/
	initialPos = 0;
	//Whether to lock the character into its current position.
	lockPosition = false;
	//Whether to lock the character into its current animation frame.
	lockAnimation = false;
	//Whether to lock the character into its current rotation angle.
	lockRotation = false;
	//The rotation angle of the character in degrees.
	_rotation = 0;
	set rotation(value) {
		if (!this.lockRotation) {
			this._rotation = value;
			this.customTransformations.rotate = value + "deg";
		}
	}
	get rotation() {
		return(this._rotation);
	}
	//The speed at which the character should rotate in degrees per frame
	rotateSpeed = 0;
	//The id of the timer that is used to animate the characters.
	static Timer_Id = null;
	//The speed at which the character should move in pixels per frame.
	movementSpeed = 20;
	/*
		The direction of the character.
		Either "left-right", "up-down", or "diagonal"
	*/
	direction = "left-right";
	/*
		The behavior of the character when it reaches an edge.
		Either "wrap", "bounce", "continue", "remove", "stop",
		"hide", "show", or "reset".
	*/
	edgeBehavior = "wrap";
	//Whether the character is rendered flipped on the x axis.
	_flipped = false;
	set flipped(value) {
		this._flipped = value;
		this.customTransformations.scaleX = value ? -1 : 1;
	}
	get flipped() {
		return this._flipped;
	}
	/*
		The point that the upper edge exists at.
		If the direction is left-right, this is the x position.
		If the direction is up-down, this is the y position.
		If the direction is diagonal, this is an array of [x, y]	
	*/
	edgeUpperPoint = null;
	/*
		The point that the lower edge exists at.
		If the direction is left-right, this is the x position.
		If the direction is up-down, this is the y position.
		If the direction is diagonal, this is an array of [x, y]	
	*/
	edgeLowerPoint = null;
	/*
		The position that puts the character at the upper edge.
		If the direction is left-right, this is the x position.
		If the direction is up-down, this is the y position.
		If the direction is diagonal, this is an array of [x, y]
	*/
	edgeUpper = () => {
		if (this.direction === "left-right") {
			return ((this.edgeUpperPoint || this.edgeUpperPoint === 0) ? this.edgeUpperPoint : this.backgroundWidth) 
				- this.width - Math.abs(this.movementSpeed);
		} else if (this.direction === "up-down") {
			return ((this.edgeUpperPoint || this.edgeUpperPoint === 0) ? this.edgeUpperPoint : this.backgroundHeight)
				- this.height - Math.abs(this.movementSpeed);
		} else if (this.direction === "diagonal") {
			return [(this.edgeUpperPoint ? this.edgeUpperPoint[0] : this.backgroundWidth) - this.width - Math.abs(this.movementSpeed[0]), 
				(this.edgeUpperPoint ? this.edgeUpperPoint[1] : this.backgroundHeight) - this.height - Math.abs(this.movementSpeed[1])];
		}
	}
	/*
		The position that puts the character at the lower edge.
		If the direction is left-right, this is the x position.
		If the direction is up-down, this is the y position.
		If the direction is diagonal, this is an array of [x, y]
	*/
	edgeLower = () => {
		if (this.direction === "diagonal") {
			return [(this.edgeLowerPoint ? this.edgeLowerPoint[0] : 0) + 
				Math.abs(this.movementSpeed),
				(this.edgeLowerPoint ? this.edgeLowerPoint[1] : 0) +
				Math.abs(this.movementSpeed)];
		} else {
			return ((this.edgeLowerPoint || this.edgeLowerPoint === 0) ? this.edgeLowerPoint : 0)
				+ Math.abs(this.movementSpeed);
		}
	};
	/*
		onEdgeReached is called when the character reaches one edge of the screen right
		before edge behavior is executed. Depending on whether it is the upper or lower edge,
		the "edge" parameter will be either "upper" or "lower" respectively.
	*/
	onEdgeReached = function(edge) {};
	/*
		onStop is called when the character's stop method is called while
		the timer is scheduled.
	*/
	onStop = function() {};
	/*
		onFrame is called on each 0.1s interval while the timer is scheduled.
	*/
	onFrame = function(frame) {};
	/*
		onAnimationEnd is called when the character's animation ends or right before it loops.
	*/
	onAnimationEnd = function() {};
	/*
		onAnimationStart is called when the character's animation starts or right after it loops.
	*/
	onAnimationStart = function() {};
	/*
		onInit is called after the elements have been initialized when you
		construct the character or call the reset method. If it is originating
		from the constructor, isReset is false. Otherwise, it is true.
	*/
	onInit = function(isReset) {};
	/*
		onRestart is called when the character's restart method is called while
		the timer is not scheduled.
	*/
	onRestart = function() {};
	/*
		onReset is called after the elements have been initialized
		when the character's reset method is called. Return false to prevent
		the character from reinitializing, which is useful if you want to
		remove the character from the screen during the reset.
	*/
	onReset = function() {};
	/*
		onRemove is called right after the character's element is removed from the DOM
		and before the character is removed from the character list.
	*/
	onRemove = function() {};
	/*
		onCollisionStay is called for every frame that this character is colliding with another character.
		The character parameter is the character that this character is colliding with.
	*/
	collisionStay = function(character) {};
	/*
		onCollisionEnter is called the frame that this character begins colliding
		with another character. The character parameter is the character that this
		character is colliding with.
	*/
	onCollisionEnter = function(character) {};
	/*
		onCollisionExit is called the frame that this character stops colliding
		with another character. The character parameter is the character that this
		character stopped colliding with.
	*/
	onCollisionExit = function(character) {};
	/*
		onPauseStart is called when the character's pause method is called.
		The argument is the number of frames that the method contributed
		to the total pause time. A frame is 0.1s.
	*/
	onPauseStart = function(frames) {};
	/*
		onPauseEnd is called when the character's clearPause method is called
		or the pause time is up.
	*/
	onPauseEnd = function() {};
	/*
		onPauseFrame is called on each frame that the character is paused.
		A frame is a 0.1s interval.
		The argument is the number of frames that the character has been paused for.
	*/
	onPauseFrame = function(frame) {};
	//Whether the animation has ended at least once yet.
	didAnimationEnd = false;
	//The amount of times the animation has looped.
	loopCount = 0;
	//The amount of frames that have passed while the timer has been scheduled.
	frameCount = 0;
	//Whether this character is on one of the edges of the screen.
	onEdge = false;
	//Whether this character is shown.
	shown = true;
	//A list of listeners for specific frames. This is used internally.
	frameListeners = [];
	//Whether this frame is the first
	firstAnimationFrame = true;
	//The id of this character's speech bubble element.
	speechBubbleId = "speech-bubble";
	//Whether this character is currently speaking.
	talking = false;
	//The text that this character is currently speaking.
	currentSpeech = "";
	//The offset x of the speech bubble.
	_speechBubbleOffsetX = 0;
	set speechBubbleOffsetX(offset) {
		if (offset === 0) this._speechBubbleOffsetX = 0;
		switch (this.defaultSpeechCorner) {
			case "top left":
			case "bottom left":
				this._speechBubbleOffsetX = offset || (this.width/2 + this.speechBubbleMargin);
				break;
			case "top right":
			case "bottom right":
				this._speechBubbleOffsetX = offset || (-this.width/2 - this.speechBubbleMargin);
				break;

		}
	}
	get speechBubbleOffsetX() {
		return this._speechBubbleOffsetX;
	}
	//The offset y of the speech bubble.
	_speechBubbleOffsetY = 0;
	set speechBubbleOffsetY(offset) {
		if (offset === 0) this._speechBubbleOffsetY = 0;
		switch (this.defaultSpeechCorner) {
			case "top left":
			case "top right":
				this._speechBubbleOffsetY = offset || (-this.height/2 - this.speechBubbleMargin);
				break;
			case "bottom left":
			case "bottom right":
				this._speechBubbleOffsetY = offset || (this.height/2 + this.speechBubbleMargin);
				break;
		}
	}
	get speechBubbleOffsetY() {
		return this._speechBubbleOffsetY;
	}
	/*
		Defines the default position of the speech bubble as a corner of the character.
		Must be either "top left", "top right", "bottom left", or "bottom right".
	*/
	defaultSpeechCorner = "top left"
	//The margin between the character and the speech bubble.
	speechBubbleMargin = 10;
	//A list of all characters that have been created and not removed so far.
	static All_Character_Instances = [];
	//Whether this character should do collision detection.
	doCollision = true;
	//The characters that this character is currently colliding with.
	collidingWith = [];
	//Whether this character should respond to timer intervals
	doTimer = false;
	//Whether this character should flip when bouncing off the edge.
	flipOnBounce = true;
	//The function that is scheduled as the timer interval. This should be a constant.
	static TIMER_INTERVAL = () => {
		Character.All_Character_Instances.forEach(character => {
			if (character.doTimer) {
				character.collisionCheck();
			}
		});

		Character.All_Character_Instances.forEach(character => {
			if (character.doTimer) {
				character.move();
			}
		});

		Character.Timer_Frames++;
		if (Character.Loop_Frames && Character.Timer_Frames >= Character.Loop_Frames) {
			Character.Loop();
		}
	};
	//The amount of frames this character should pause before running the main timer interval.
	pauseFrames = 0;
	//The amount of frames this character has paused.
	pauseTime = 0;
	//Whether this character is currently paused.
	paused = false;
	//A list of callbacks that are called when the character is unpaused and then removed.
	unpauseCallbacks = [];
	/*
		Used to allow for custom transformations. For each CSS transform property, there can be
		a custom value. This is represented as an object with the property name as the key and
		the value as the value.

		Note that the scaleX and rotate values are controlled by the flipped and rotate properties
		of this character respectively for backwards compatibility reasons.
	*/
	customTransformations = {};
	//An audio element that is played when the timer is running and paused otherwise.
	static Timer_Audio = null;
	//The amount of frames before the entire animation should be looped. null for no loop.
	static Loop_Frames = null;
	//The amount of frames that the timer has been running before a loop.
	static Timer_Frames = 0;
	//The element used for debugging this character's position
	debugElement = null;

	/*
		This is the initialization function for the character.
		It is called when the character is constructed or reset.
	*/
	init(isReset) {
		this.original = clone(this);
		delete this.original.debugElement;
		this.elem = document.querySelector(`#${this.elemId}`);
		this.background = document.querySelector(`#${this.backgroundId}`);
		this.speechBubble = document.querySelector(`#${this.speechBubbleId}`);
		switch (this.direction) {
			case "left-right":
				if (this.x > this.getEdgeUpper()) {
					this.x = this.getEdgeUpper();
				} else if (this.x < this.getEdgeLower()) {
					this.x = this.getEdgeLower();
				}
				break;
			case "up-down":
				if (this.y > this.getEdgeUpper()) {
					this.y = this.getEdgeUpper();
				} else if (this.y < this.getEdgeLower()) {
					this.y = this.getEdgeLower();
				}
				break;
			case "diagonal":
				if (this.x > this.getEdgeUpper()[0]) {
					this.x = this.getEdgeUpper()[0];
				} else if (this.x < this.getEdgeLower()[0]) {
					this.x = this.getEdgeLower()[0];
				}
				if (this.y > this.getEdgeUpper()[1]) {
					this.y = this.getEdgeUpper()[1];
				} else if (this.y < this.getEdgeLower()[1]) {
					this.y = this.getEdgeLower()[1];
				}
				break;
		}

		this.debugElement = createDebugElement();
		if (this.debugElement) {
			this.debugElement.updateVisuals = () => {
				this.debugElement.innerHTML = `${this.elemId}: (${this.x}, ${this.y})`;
				if (debug) {
					//Add a red border to the element
					this.elem.style.border = "1px solid red";
				} else {
					//Remove the border
					this.elem.style.border = "none";
				}
			};
		}
		this.updateVisuals();

		if (this.speechBubble) {
			let text = this.speechBubble.querySelector(".text");
			text.onmousedown = (e) => false;
			text.style.cursor = "default";
		}
		
		this.onInit(isReset);
		this.elem.style.display = "none";

		if (this.doTimer && !Character.Timer_Id) {
			Character.ScheduleTimers();
		}
	}
	
	/*
		The default constructor for the Character class.
		args is an object that can override the default values for
		any property. After applying these values and registering
		the character in the character list, the callback is called.
		Then, the elements and rendering are initialized and onInit
		is called with false as the first parameter.
	*/
	constructor(args, callback) {
		Object.assign(this, args);
		//If this character is not in the list of all characters, add it.
		if (!Character.All_Character_Instances.includes(this)) {
			Character.All_Character_Instances.push(this);
		}

		if (callback) {
			callback.bind(this)();
		}

		this.init(false);

		//When this character is clicked, create a point there.
		this.elem.addEventListener("click", (e) => {
			if (debug) {
				createPoint(e);
			}
		});
	}

	/*
		Create a new character with the default values and the specified callback.
	*/
	static CreateDefault(callback) {
		return(new Character({}, callback));
	}

	/*
		Create a new character with the most basic values specified and the specified callback.
		The basic values are:
			- parentDir
			- elemId
			- frameImgs
			- loop
			- x
			- y
			- direction
			- edgeBehavior
			- rotateSpeed
			- movementSpeed
			- speechBubbleId
	*/
	static Create(parentDir, elemId, backgroundId, frameImgs, loop, animateSpeed, x, y, direction, edgeBehavior, rotateSpeed, movementSpeed, speechBubbleId, callback) {
		let result = new Character({parentDir, elemId, backgroundId, frameImgs, loop, animateSpeed, x, y, direction, edgeBehavior, rotateSpeed, movementSpeed, speechBubbleId}, callback);
		if (edgeBehavior === "wrap") {
			if (direction === "diagonal") {
				result.initialPos = [x, y];
			} else if (direction === "left-right") {
				result.initialPos = result.x;
			} else if (direction === "up-down") {
				result.initialPos = result.y;
			}
		}
		return(result);
	}

	/*
		Create a new character with the most basic values specified plus the edges and the specified callback.
		The basic values are:
			- parentDir
			- elemId
			- frameImgs
			- loop
			- x
			- y
			- direction
			- edgeBehavior
			- rotateSpeed
			- movementSpeed
			- speechBubbleId
	*/
	static CreateWithEdges(parentDir, elemId, backgroundId, frameImgs, loop, animateSpeed, x, y, direction, edgeBehavior, rotateSpeed, movementSpeed, edgeUpper, edgeLower, speechBubbleId, callback) {
		let result = new Character({parentDir, elemId, backgroundId, frameImgs, loop, animateSpeed, x, y, direction, edgeBehavior, rotateSpeed, movementSpeed, edgeUpperPoint: edgeUpper, edgeLowerPoint: edgeLower, speechBubbleId}, callback);
		if (edgeBehavior === "wrap") {
			if (direction === "diagonal") {
				result.initialPos = [x, y];
			} else if (direction === "left-right") {
				result.initialPos = result.x;
			} else if (direction === "up-down") {
				result.initialPos = result.y;
			}
		}
		return(result);
	}

	/*
		Create a new character with a diagonal direction plus the most basic values specified, and the specified callback.
		The basic values are:
			- parentDir
			- elemId
			- frameImgs
			- loop
			- x
			- y
			- initialPos
			- edgeBehavior
			- rotateSpeed
			- movementSpeed
			- speechBubbleId
	*/
	static CreateDiagonal(parentDir, elemId, backgroundId, frameImgs, loop, animateSpeed, x, y, initialPosX, initialPosY, edgeBehavior, rotateSpeed, movementSpeedX, movementSpeedY, speechBubbleId, callback) {
		return(new Character({parentDir, elemId, backgroundId, frameImgs, loop, animateSpeed, x, y, initialPos: [initialPosX, initialPosY], direction: "diagonal", edgeBehavior, rotateSpeed, movementSpeed: [movementSpeedX, movementSpeedY], speechBubbleId}, callback));
	}

	/*
		Remove this character's element from the DOM, call the onRemove event,
		and remove this character from the characters array.
	*/
	remove() {
		this.elem.remove();
		if (this.debugElement) {
			this.debugElement.remove();
		}
		this.stop();
		this.onRemove();
		Character.All_Character_Instances = Character.All_Character_Instances.filter((character) => character !== this);
	}

	/*
		Stop this character from updating when the timer interval is called
		then call the onStop event. The event will not be called if the character
		is already stopped.
		If this is the final character to be stopped, stop the timer.
	*/
	stop() {
		if (Character.CountResponsiveCharacters() === 1) {
			Character.RemoveTimers();
		}

		if (this.doTimer) {
			this.doTimer = false;
			this.onStop();
		}
	}

	/*
		Restart this character's timer interval and call the onStart event.
		The event will not be called if the character is already started.
		If the timer is not scheduled, this function will schedule it for you.
	*/
	restart() {
		if (!Character.Timer_Id) {
			Character.ScheduleTimers();
		}

		if (!this.doTimer) {
			this.doTimer = true;
			this.onRestart();
		}
	}

	/*
		Schedule the timer interval that characters will respond to and play the timer audio.
		The timer runs every 0.1 seconds. This function will only be called if the timer is not already scheduled.

		You don't actually need to call this function, it is called automatically
		when a character is started while it is unscheduled. However, you can call it manually if
		you want to schedule the timer before the character starts or be more clear about when it is scheduled.
	*/
	static ScheduleTimers() {
		if (!Character.Timer_Id) {
			Character.Timer_Id = setInterval(Character.TIMER_INTERVAL, 100);
			if (Character.Timer_Audio) {
				//Play the timer audio element. Set it to loop.
				Character.Timer_Audio.play();
				Character.Timer_Audio.loop = true;
			}
		}
	}

	/*
		Remove the timer interval that characters will respond to and stop the timer audio. This function
		will only be called if the timer is scheduled.

		You don't actually need to call this function, it is called automatically
		when a the last scheduled character is stopped. However, you can call it manually if
		you want to stop the timer before the character stops or be more clear about when it is removed.
	*/
	static RemoveTimers() {
		if (Character.Timer_Id) {
			clearInterval(Character.Timer_Id);
			Character.Timer_Id = null;
			if (Character.Timer_Audio) {
				//Pause the timer audio element.
				Character.Timer_Audio.pause();
			}
		}
	}

	/*
		Reset the timer audio element to the beginning.
	*/
	static ResetTimerAudio() {
		if (Character.Timer_Audio) {
			Character.Timer_Audio.currentTime = 0;
		}
	}

	/*
		Loop the entire animation by stopping all characters, resetting them, and restarting them.
		In effect, the animation is restarted. If the timer is not scheduled, this function will schedule it
		and begin running the animation.

		Note that this will not loop the timer audio.
	*/
	static Loop() {
		Character.Timer_Frames = 0;
		Character.All_Character_Instances.forEach((character) => character.stop());
		Character.All_Character_Instances.forEach((character) => character.reset());
		Character.All_Character_Instances.forEach((character) => character.restart());
	}

	/*
		Count the number of characters that are responsive to the timer interval.
		This function is used to determine if the timer should be removed after the last character stops.
	*/
	static CountResponsiveCharacters() {
		let count = 0;
		for (let character of Character.All_Character_Instances) {
			if (character.doTimer) {
				count++;
			}
		}

		return(count);
	}

	/*
		Stop this character, reassign the original properties,
		call the onReset event, and reinitialize the character.

		Note: This does not include the callback that was passed in to the constructor.
		If you want your logic to run both when the character is reset and when it is created,
		use the onInit event instead. That event has an argument that will be true when the character is reset
		and false when it is created.
	*/
	reset() {
		this.stop();
		Object.assign(this, this.original);
		if (this.onReset() === false) return;
		this.init(true);
	}

	/*
		Flip the character's image horizontally.
		This function only controls the internal flipped state.
		The character will not render flipped until you call
		the updateVisuals function or it is called by the timer.
	*/
	flip() {
		this.flipped = !this.flipped;
	}

	/*
		Returns a string that represents the custom transformations of this character
		as a CSS string. Each transformation is stored as a key-value pair in the
		customTransformations object. The key is the name of the transformation and
		the value is the value of the transformation.
	*/
	getTransformationString() {
		let result = "";
		for (let key in this.customTransformations) {
			result += `${key}(${this.customTransformations[key]}) `;
		}
		return(result);
	}

	/*
		Update the character's element and the speech bubble
		to reflect the current state.
		The properties that are updated are:
			- position
			- rotation
			- flipped
			- src
			- display
			- speech bubble text
			- speech bubble display
			- speech bubble position

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled.
	*/
	updateVisuals() {
		while(this.rotation >= 360) {
			this.rotation -= 360;
		}
		while(this.rotation < 0) {
			this.rotation += 360;
		}
		this.elem.style.transform = this.getTransformationString();
		this.elem.style.left = this.x + "px";
		this.elem.style.top = this.y + "px";
		this.elem.src = this.parentDir + "/" + this.frameImgs[parseInt(this.frameNumber)];
		this.elem.style.display = this.shown ? "block" : "none";
		if (this.speechBubble) {
			this.speechBubble.style.display = this.shown && this.talking ? "block" : "none";
			this.speechBubble.querySelector(".text").innerText = this.currentSpeech;
			this.speechBubble.style.left = (this.x + this.speechBubbleOffsetX) + "px";
			this.speechBubble.style.top = (this.y + this.speechBubbleOffsetY) + "px";
		}

		if (this.debugElement) {
			this.debugElement.updateVisuals();
		}
	}

	/*
		Get the current edgeUpper value. It may either be a number or a function,
		but this function will always return a number.
	*/
	getEdgeUpper() {
		if (typeof this.edgeUpper === "function") {
			return(this.edgeUpper());
		} else {
			return(this.edgeUpper);
		}
	}

	/*
		Get the current edgeLower value. It may either be a number or a function,
		but this function will always return a number.
	*/
	getEdgeLower() {
		if (typeof this.edgeLower === "function") {
			return(this.edgeLower());
		} else {
			return(this.edgeLower);
		}
	}

	/*
		Schedule the specified function to be called afer the specified number of frames.
		Frames are 0.1 seconds and will only be run if the timer is scheduled. Returns
		the listener that was added.
	*/
	inFrames(frame, funct) {
		return this.addFrameListener(funct, this.frameCount + frame);
	}

	/*
		Schedule the specified function to be called every frame until the
		specified number of frames have passed. Frames are 0.1 seconds and will
		only be run if the timer is scheduled. Returns the list of listeners.
	*/
	forFrames(frames, funct) {
		let result = [];
		for (let i = 1; i <= frames; i++) {
			result.push(this.addFrameListener(funct, this.frameCount + i));
		}
		return result;
	}

	/*
		Schedule the specified function to be called at the specified frame.
		Frames are 0.1 seconds and will only be run if the timer is scheduled.
		Returns the listener that was added.
	*/
	addFrameListener(funct, frame) {
		let listener = {funct: funct.bind(this), frame};
		this.frameListeners.push(listener);
		return listener;
	}

	/*
		Remove the specified listener from the list of listeners.
		The argument can be either the listener object returned by addFrameListener,
		the function the listener uses, or the frame number that was passed.
	*/
	removeFrameListener(obj) {
		if (typeof obj === "function") {
			this.frameListeners = this.frameListeners.filter(listener => listener.funct !== obj);
		} else if (typeof obj === "number") {
			this.frameListeners = this.frameListeners.filter(listener => listener.frame !== obj);
		} else if (typeof obj === "object") {
			this.frameListeners = this.frameListeners.filter(listener => listener !== obj);
		}
	}

	/*
		Prevent the character's element from being displayed on the screen. This
		only updates the internal state. The character will not be hidden until
		you call the updateVisuals function or it is called by the timer.
	*/
	hide() {
		this.shown = false;
	}

	/*
		Allow the character's element to be displayed on the screen. This
		only updates the internal state. The character will not be shown until
		you call the updateVisuals function or it is called by the timer.
	*/
	show() {
		this.shown = true;
	}

	/*
		Say the specified text for the specified number of frames. Each frame
		is 0.1 seconds and will only pass if this character responds to the timer.
		The text will be spoken in the character's speech bubble,
		which will be shown for the duration.

		offsetX and offsetY are the offsets from the character's position that
		the speech bubble should be positioned at. If unspecified, they will be
		determined by the character's defaultOffsetCorner property.

		This function only updates the internal state. The speech bubble will
		not be shown until you call the updateVisuals function or it is called
		by the timer.
	*/
	sayTime(text, frames, offsetX, offsetY) {
		if (this.speechBubble) {
			this.forFrames(frames - 1, function() {
				this.say(text, offsetX, offsetY)
			});
			this.inFrames(frames, function() {
				this.stopTalking();
			});
		}
	}

	/*
		Begin to say the specified text. The text will be spoken in the character's
		speech bubble, which will be shown.

		offsetX and offsetY are the offsets from the character's position that
		the speech bubble should be positioned at. If unspecified, they will be
		determined by the character's defaultOffsetCorner property.

		This function only updates the internal state. The speech bubble will
		not be shown until you call the updateVisuals function or it is called
		by the timer.

		You may control when the speech bubble is shown by calling the
		stopTalking and say functions (recommended) or directly by assigning the talking property.
	*/
	say(text, offsetX, offsetY) {
		if (this.speechBubble) {
			this.currentSpeech = text;
			this.speechBubbleOffsetX = offsetX;
			this.speechBubbleOffsetY = offsetY;
			this.talking = true;
		}
	}

	/*
		Stop saying things. This will hide the speech bubble.

		This function only updates the internal state. The speech bubble will
		not be hidden until you call the updateVisuals function or it is called
		by the timer.

		You may control when the speech bubble is shown by calling the
		stopTalking and say functions (recommended) or directly by assigning the talking property.
	*/
	stopTalking() {
		if (this.speechBubble) {
			this.talking = false;
			this.currentSpeech = "";
		}
	}

	/*
		Tell this character to pause the timer interval for the specified number
		of frames. A frame is 0.1 seconds. If the callback is specified, it will
		be called when the timer is next resumed.
	*/
	pause(frames, callback) {
		this.pauseFrames += frames;
		this.onPauseStart(frames);
		if (callback) {
			this.unpauseCallbacks.push(callback);
		}
	}

	/*
		Clear the pause time for this character.
	*/
	clearPause() {
		this.pauseFrames = 0;
		this.pauseTime = 0;
		this.paused = false;
		this.onPauseEnd();
		let self = this;
		//Call each unpause callback
		this.unpauseCallbacks.forEach(function(callback) {
			callback.bind(self)();
		});
		this.unpauseCallbacks = [];
	}

	/*
		Determine if this character is currently colliding with another character.
		This is determined by checking if the character's element is overlapping
		with another character's element.
	*/
	collidesWith(character) {
		return(
			this.x + this.width >= character.x &&
			this.x <= character.x + character.width &&
			this.y + this.height >= character.y &&
			this.y <= character.y + character.height
		);
	}

	/*
		Check each existing character to see if this character is colliding with
		them. If so, call the relevant collision functions.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.
	*/
	collisionCheck() {
		//If this character is colliding with another character, call the collisionStay function
		Character.All_Character_Instances.forEach(character => {
			if (character !== this) {
					if (this.collidesWith(character)) {
						if (this.doCollision) {
							//If the other character was not previously colliding with this character, call the onCollisionEnter function
							if (!this.collidingWith.includes(character)) {
								this.collidingWith.push(character);
								this.onCollisionEnter(character);
							}
							
							this.collisionStay(character);
						}
					}

					//If this character is not colliding with the other character and it is in the list of colliding characters, remove it
					if (!this.collidesWith(character) && this.collidingWith.includes(character)) {
						this.collidingWith = this.collidingWith.filter(collidingCharacter => collidingCharacter !== character);
						this.onCollisionExit(character);
					}
			}
		});
	}

	/*
		Change the movement speed from positive to negative or vice versa.
		This is used by the bounce function.
	*/
	invertMovementSpeed() {
		switch (this.direction) {
			case "left-right":
			case "up-down":
				this.movementSpeed *= -1;
				break;
			case "diagonal":
				this.movementSpeed[0] *= -1;
				this.movementSpeed[1] *= -1;
				break;
		}
	}

	/*
		This function is used to handle the movement of the character every frame.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.
	*/
	handleMovement() {
		if (!this.lockPosition) {
			switch (this.direction) {
				case "left-right":
					this.x += this.movementSpeed;
					break;
				case "up-down":
					this.y += this.movementSpeed;
					break;
				case "diagonal":
					this.x += this.movementSpeed[0];
					this.y += this.movementSpeed[1];
					break;
			}
		}
	}

	/*
		Invert the movement speed of the character, move one frame's worth of position,
		and then flip the character's element.
	*/
	bounce() {
		if (!this.lockPosition) {
			this.invertMovementSpeed();
			this.handleMovement();
			if (this.flipOnBounce) {
				this.flip();
			}
		}
	}

	/*
		Wrap the character's position to the initial position.
	*/
	wrap() {
		if (!this.lockPosition) {
			switch (this.direction) {
				case "left-right":
					this.x = this.initialPos;
					break;
				case "up-down":
					this.y = this.initialPos;
					break;
				case "diagonal":
					this.x = this.initialPos[0];
					this.y = this.initialPos[1];
					break;
			}
		}
	}

	/*
		Execute the edge behavior of the character.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.

		This function will return false if the character is reset, removed, or
		stopped. Otherwise, it will return true.
	*/
	executeEdgeBehavior() {
		switch (this.edgeBehavior) {
			case "wrap":
				this.wrap();
				return true;
			case "stop":
				this.stop();
				return false;
			case "bounce":
				this.bounce();
				return true;
			case "hide":
				this.hide();
				break;
			case "show":
				this.show();
				break;
			case "remove":
				this.remove();
				return false;
			case "continue":
				this.handleMovement();
				return true;
			case "reset":
				this.reset();
				return false;
		}

		this.handleMovement();
		return true;
	}

	/*
		Determine if the character is at the left edge of the canvas.
		Characters that have a direction of "up-down" don't have left or
		right edges, so this function will return false in that case.
	*/
	isOnLeftEdge() {
		switch (this.direction) {
			case "left-right":
				return this.x < this.getEdgeLower();
			case "up-down":
				//There is no left edge for up-down characters
				return false;
			case "diagonal":
				return this.x < this.getEdgeLower()[0];
		}
	}

	/*
		Determine if the character is at the right edge of the canvas.
		Characters that have a direction of "up-down" don't have left or
		right edges, so this function will return false in that case.
	*/
	isOnRightEdge() {
		switch (this.direction) {
			case "left-right":
				return this.x > this.getEdgeUpper();
			case "up-down":
				//There is no right edge for up-down characters
				return false;
			case "diagonal":
				return this.x > this.getEdgeUpper()[0];
		}
	}

	/*
		Determine if the character is at the top edge of the canvas.
		Characters that have a direction of "left-right" don't have top or
		bottom edges, so this function will return false in that case.
	*/
	isOnTopEdge() {
		switch (this.direction) {
			case "left-right":
				//There is no top edge for left-right characters
				return false;
			case "up-down":
				return this.y < this.getEdgeLower();
			case "diagonal":
				return this.y < this.getEdgeLower()[1];
		}
	}

	/*
		Determine if the character is at the bottom edge of the canvas.
		Characters that have a direction of "left-right" don't have top or
		bottom edges, so this function will return false in that case.
	*/
	isOnBottomEdge() {
		switch (this.direction) {
			case "left-right":
				//There is no bottom edge for left-right characters
				return false;
			case "up-down":
				return this.y > this.getEdgeUpper();
			case "diagonal":
				return this.y > this.getEdgeUpper()[1];
		}
	}

	/*
		Determine if the character is colliding with the upper edge (right or bottom) of the canvas.
	*/
	isOnUpperEdge() {
		switch (this.direction) {
			case "left-right":
				return this.isOnRightEdge();
			case "up-down":
				return this.isOnBottomEdge();
			case "diagonal":
				return this.isOnBottomEdge() || this.isOnRightEdge();
		}
	}

	/*
		Determine if the character is colliding with the lower edge (left or top) of the canvas.
	*/
	isOnLowerEdge() {
		switch (this.direction) {
			case "left-right":
				return this.isOnLeftEdge();
			case "up-down":
				return this.isOnTopEdge();
			case "diagonal":
				return this.isOnTopEdge() || this.isOnLeftEdge();
		}
	}

	/*
		Determine if the character is colliding with any of the edges of the canvas.
	*/
	isOnEdge() {
		return this.isOnUpperEdge() || this.isOnLowerEdge();
	}

	/*
		Used by the character's timer response loop to handle edge collisions.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.

		This function will return false if the character is reset, removed, or
		stopped. Otherwise, it will return true.
	*/
	handleEdge() {
		if (this.isOnEdge()) {
			if (this.edgeBehavior === "reset") {
				this.reset();
				return false;
			}
			if (!this.onEdge) {
				this.onEdge = true;
				if (this.isOnUpperEdge()) {
					this.onEdgeReached("upper");
				} else {
					this.onEdgeReached("lower");
				}
			}
			this.onEdge = true;
			return this.executeEdgeBehavior();
		} else {
			this.onEdge = false;
			return true;
		}
	}

	/*
		Used by the character's timer response loop to handle animation.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.
	*/
	handleAnimation() {
		if (!this.lockAnimation) {
			if (this.firstAnimationFrame) {
				this.onAnimationStart();
				this.firstAnimationFrame = false;
			}
			
			this.frameNumber += this.animateSpeed;
			if (this.frameNumber >= this.frameImgs.length - 1) {
				if ((this.loopCount === 0 && !this.didAnimationEnd) || this.loop) {
					this.onAnimationEnd();
					this.loopCount++;
				}
				this.didAnimationEnd = true;
				if (this.loop) {
					if (this.frameImgs.length > 1) {
						this.frameNumber %= this.frameImgs.length - 1;
						this.onAnimationStart();
					} else {
						this.frameNumber = 0;
					}
				} else {
					this.frameNumber = this.frameImgs.length - 1;
				}
			}
		}
	}

	/*
		Used by the character's timer response loop to handle rotation.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.
	*/
	handleRotation() {
		if (!this.lockRotation) {
			this.rotation += this.rotateSpeed;
			while(this.rotation >= 360) {
				this.rotation -= 360;
			}
			while(this.rotation < 0) {
				this.rotation += 360;
			}
		}
	}

	/*
		Used by the character's timer response loop to invoke the character's
		frame listeners if the current frame matches the listener's frame.

		This is part of the character's timer response loop, meaning that it
		will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.
	*/
	invokeFrameListeners() {
		this.frameListeners.forEach(function(listener) {
			if (listener.frame === this.frameCount) {
				listener.funct(this.frameCount);
				this.removeFrameListener(listener);
			}
		}.bind(this));
	}

	/*
		The character's timer response loop.

		This will be called every frame if the timer is scheduled. Frames are 0.1
		seconds.
	*/
	move() {
		if (this.pauseFrames > 0) {
			this.pauseFrames--;
			if (this.pauseFrames <= 0) {
				this.clearPause();
			}
			this.pauseTime++;
			this.onPauseFrame(this.pauseTime);
			this.paused = true;
			return;
		}

		if (!this.handleEdge()) return;
		
		this.handleMovement();
		this.handleRotation();
		this.handleAnimation();

		this.frameCount++;
		this.invokeFrameListeners();
		this.onFrame(this.frameCount);
		this.updateVisuals();
	}
}

function genFrameList(maxFrame, suffix) {
	let frameList = [];
	//Get the amount of digits in the max frame.
	let digits = maxFrame.toString().length;
	
	for (let i = 0; i < maxFrame; i++) {
		let frame = i.toString();
		while (frame.length < digits) {
			frame = "0" + frame;
		}
		frameList.push("frame_" + frame + "." + suffix);
	}
	return frameList;
}

Character.Timer_Audio = document.querySelector("#music");
Character.Timer_Audio.volume = 0.5;
Character.Loop_Frames = 350;

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
	genFrameList(38, "png"), true, 1, 0, 251, "left-right", "bounce", 0,
	0, null, function() {
		this.onFrame = function(frame) {
			this.y = this.backgroundHeight - this.height - 10;
		}
	});

let groupDance = Character.Create("images/group_dance", "group-dance", "background",
	genFrameList(106, "gif"), true, 1, 280, 251, "left-right", "bounce", 0,
	0, null, function() {
		this.onFrame = function(frame) {
			this.y = this.backgroundHeight - this.height + 10;
		}
	});


//Determine if the last action was a reset
let justReset = false;
function moveAll() {
	Character.All_Character_Instances.forEach(character => {
		character.restart();
	});
	Character.ScheduleTimers();
	if (justReset) {
		Character.ResetTimerAudio();
	}
	justReset = false;
}

function moveFrameAll() {
	Character.All_Character_Instances.forEach(character => {
		character.restart();
	});
	if (Character.Timer_Audio) Character.Timer_Audio.pause();
	Character.TIMER_INTERVAL();
	stopAll();
	if (Character.Timer_Audio) {
		//Advance the timer audio by 0.1 seconds, the length of a frame
		Character.Timer_Audio.currentTime += 0.1;
	}
	justReset = false;
}

function stopAll() {
	Character.All_Character_Instances.forEach(character => {
		character.stop();
	});
	Character.RemoveTimers();
	justReset = false;
}

function resetAll(keepMusic) {
	Character.All_Character_Instances.forEach(function(character) {
		character.reset();
	});
	stopAll();
	Character.Timer_Frames = 0;
	if (!keepMusic) Character.ResetTimerAudio();
	justReset = true;
}

/*
	When the mouse is over the element with the id "background" or the class "speech-bubble",
	get the mouse position relative to the element and set the text of the element with
	the id "debug" to "Mouse Position: " followed by the mouse position (as integers)
	in parenthesis.
*/
document.querySelector("#background")
	.addEventListener("mousemove", function(e) {
		if (debug) {
			let bounding = e.target.getBoundingClientRect();
			let mouseX = e.clientX - bounding.left;
			let mouseY = e.clientY - bounding.top;
			document.querySelector("#mouse-position").innerHTML =
				"Mouse Position: (" +
				parseInt(mouseX) +
				", " + parseInt(mouseY) + ")";
		}
});

document.querySelectorAll(".speech-bubble").forEach(elem => {
	elem.addEventListener("mousemove", function(e) {
		if (debug) {
			let bounding = document.querySelector("#background").getBoundingClientRect();
			//Update the element with the id "mouse-position" to the position of the mouse relative to the background.
			document.querySelector("#mouse-position").innerHTML =
				"Mouse Position: (" +
				parseInt(e.clientX - bounding.left) +
				", " + parseInt(e.clientY - bounding.top) + ")";
		}
	});
});


/*
	Every 0.1 seconds, Set the value of the element with id "bounds"
	to the screen width and height of the background
	in the format "width: xxx, height: yyy"
*/
setInterval(function() {
	if (debug) {
		let bounds = document.querySelector("#bounds");
		let background = document.querySelector("#background");
		bounds.innerHTML = 
			`width: ${background.clientWidth}, height: ${background.scrollHeight}`;
	}
}, 100);

points = []

function makeDraggable(elem) {
	elem.dragged = false;
	//Using mousedown and mousemove events, make the point draggable.
	elem.addEventListener("mousedown", function(e) {
		e.stopPropagation();
		let bounding = document.querySelector("#background").getBoundingClientRect();
		let x = e.clientX - bounding.left;
		let y = e.clientY - bounding.top;
		let offsetX = x - elem.offsetLeft;
		let offsetY = y - elem.offsetTop;
		let moveAt = function(e) {
			//If the drag distance is greater than 20 pixels, set dragged to true and drag.
			if (Math.abs(e.clientX - bounding.left - offsetX) > 20 ||
				Math.abs(e.clientY - bounding.top - offsetY) > 20) {
				elem.dragged = true;
				let background = document.querySelector("#background");
				elem.style.left = e.clientX - bounding.left - offsetX + "px";
				elem.style.top = e.clientY - bounding.top - offsetY + "px";
				//If the point is dragged outside the background, limit it to the background.
				if (elem.offsetLeft < 0) {
					elem.style.left = 0;
					document.removeEventListener("mousemove", moveAt);
				} else if (elem.offsetLeft + elem.offsetWidth > background.clientWidth) {
					elem.style.left = background.clientWidth - elem.offsetWidth + "px";
					document.removeEventListener("mousemove", moveAt);
				} else if (elem.offsetTop < 0) {
					elem.style.top = 0;
					document.removeEventListener("mousemove", moveAt);
				} else if (elem.offsetTop + elem.offsetHeight > background.clientHeight) {
					elem.style.top = background.clientHeight - elem.offsetHeight + "px";
					document.removeEventListener("mousemove", moveAt);
				}
			}
		};

		elem.dragged = false;
		document.addEventListener("mousemove", moveAt);
		elem.addEventListener("mouseup", function() {
			document.removeEventListener("mousemove", moveAt);
		});
	});
}

/*
	place a draggable div with the class "point" at the position of the click in the element with the id "container.
	As a child, create an img element with the class "point-img" and the src
	attribute set to "images/point.png". As another child, create a p element with the number of the point.
	When the div element is clicked, remove it from the DOM.
*/
createPoint = function(e) {
	let bounding = document.querySelector("#background").getBoundingClientRect();
	let mouseX = e.clientX - bounding.left;
	let mouseY = e.clientY - bounding.top;
	let elem = document.createElement("div");
	
	elem.classList.add("point");
	elem.style.left = mouseX + "px";
	elem.style.top = mouseY + "px";

	makeDraggable(elem);

	elem.addEventListener("mouseup", function(e) {
		if (!elem.dragged) {
			e.stopPropagation();
			elem.remove();
			points = points.filter(
				function(el) {
					return el !== elem; 
				}
			);
		}
		elem.dragged = false;
	});

	elem.addEventListener("mousemove", function(e) {
		if (debug) {
			//Update the element with the id "mouse-position" to the position of the mouse relative to the background.
			document.querySelector("#mouse-position").innerHTML =
				"Mouse Position: (" +
				parseInt(e.clientX - bounding.left) +
				", " + parseInt(e.clientY - bounding.top) + ")";
		}
	});

	let img = document.createElement("img");
	//Prevent the image from being dragged
	img.onmousedown = (e) => false;
	img.className = "point-img";
	img.src = "images/point.png";
	let p = document.createElement("p");
	p.onmousedown = (e) => false;
	p.style.cursor = "default";
	p.innerHTML = points.length + 1;
	elem.appendChild(img);
	elem.appendChild(p);
	document.querySelector("#container").appendChild(elem);
	points.push(elem);
}

//When the element with the id "background" is clicked, create a point there.
document.querySelector("#background").addEventListener("click", function(e) {
	if (debug) {
		createPoint(e);
	}
});
//When an element with the class "speech-bubble" is clicked, create a point there.
document.querySelectorAll(".speech-bubble").forEach(function(elem) {
	elem.addEventListener("click", function(e) {
		if (debug) {
			createPoint(e);
		}
	});
});


/*
	Periodically update the text of the element with the id "points" to the position of each point
	in the format "Point x: (x, y)" where x is the number of the point and (x, y) is the position of the point.

	Put each entry in its own p element.
	Then, update the point number for each point and limit point positions to the canvas.
*/
setInterval(function() {
	if (debug) {
		let pointsText = document.querySelector("#points");
		let canvas = document.querySelector("#background");
		let canvasBounding = canvas.getBoundingClientRect();
		//Save the current scroll position of the element.
		let scrollX = pointsText.scrollLeft;

		let temp = document.createElement("div");

		let label = document.createElement("p");
		label.innerHTML = "Point Positions: ";
		temp.appendChild(label);

		points.forEach(function(point, index) {
			let pointBounding = point.getBoundingClientRect();
			let p = document.createElement("p");
			let x = parseInt(pointBounding.left - canvasBounding.left);
			let y = parseInt(pointBounding.top - canvasBounding.top);
			p.innerHTML = `Point ${index + 1}: (${x}, ${y})`;
			temp.appendChild(p);
			//Update the p element with the index of this point
			point.querySelector("p").innerHTML = points.findIndex(el => el === point) + 1;
		});

		let spacer = document.createElement("div");
		spacer.style.marginRight = "50px";
		temp.appendChild(spacer);

		//Limit point positions to the canvas
		points.forEach(function(point) {
			if (point.offsetLeft < 0) {
				point.style.left = 0;
			} else if (point.offsetLeft + point.offsetWidth > canvas.clientWidth) {
				point.style.left = canvas.clientWidth - point.offsetWidth + "px";
			} else if (point.offsetTop < 0) {
				point.style.top = 0;
			} else if (point.offsetTop + point.offsetHeight > canvas.clientHeight) {
				point.style.top = canvas.clientHeight - point.offsetHeight + "px";
			}
		});

		pointsText.innerHTML = temp.innerHTML;

		//Restore the scroll position of the element.
		pointsText.scrollLeft = scrollX;

		if (points.length == 0) {
			pointsText.innerHTML = "<p>No debug points. Click the canvas to add some.</p>";
			//Hide the button to clear the points
			document.querySelector("#clear").style.display = "none";
		} else {
			//Show the button to clear the points
			document.querySelector("#clear").style.display = "block";
		}
	}
}, 100);

function clearPoints() {
	points.forEach(point => {
		point.remove();
	});
	points = [];
}

function showInstructionPopup() {
	stopAll();
	document.querySelector("#popup").style.display = "block";
}

function hideInstructionPopup() {
	document.querySelector("#popup").style.display = "none";
}

/*
	Toggle the debug mode. If on, show elements with ids of
	"points", "character-positions", "bounds", "clear", and "mouse-position" and show the points.
	If off, hide these elements.
*/
function toggleDebug() {
	debug = !debug;
	if (debug) {
		document.querySelector("#points").style.display = "flex";
		document.querySelector("#character-positions").style.display = "flex";
		document.querySelector("#bounds").style.display = "block";
		document.querySelector("#mouse-position").style.display = "block";
		document.querySelector("#clear").style.display = "block";
		document.querySelectorAll(".point").forEach(function(point) {
			point.style.display = "flex";
		});
	} else {
		document.querySelector("#points").style.display = "none";
		document.querySelector("#character-positions").style.display = "none";
		document.querySelector("#bounds").style.display = "none";
		document.querySelector("#mouse-position").style.display = "none";
		document.querySelector("#clear").style.display = "none";
		document.querySelectorAll(".point").forEach(function(point) {
			point.style.display = "none";
		});
	}
}

/*
	Toggle whether or not the music has controls shown.
*/
function toggleMusicControls() {
	let musicControls = document.querySelector("#music");
	musicControls.controls = !musicControls.controls;
}

//Sync the debug mode with the checkbox
debug = document.querySelector("#debug").checked;

//If debug mode is off, hide the debug elements
if (!debug) {
	document.querySelector("#points").style.display = "none";
	document.querySelector("#character-positions").style.display = "none";
	document.querySelector("#bounds").style.display = "none";
	document.querySelector("#mouse-position").style.display = "none";
	document.querySelector("#clear").style.display = "none";
	document.querySelectorAll(".point").forEach(function(point) {
		point.style.display = "none";
	});
}

//Sync the music controls with the checkbox
document.querySelector("#music").controls = document.querySelector("#controls").checked;