module.exports = class Entity{
	constructor(x,y){
		if(!arguments.length){
			this.x = 250;
			this.y = 250;
		}else{
			this.x = x;
			this.y = y;
		}
		this.spdX = 0;
		this.spdY = 0;
		this.id = 0;
		this.hitbox = {px:this.x, py:this.y, width:0, height:0};
	}
	update(){
		this.updatePosition();
	}
	updatePosition(){
		this.x += this.spdX;
		this.y += this.spdY;
	}
	getDistance(pt){
		return Math.sqrt(Math.pow(this.x-pt.x,2) + Math.pow(this.y-pt.y,2));
	}
	hitboxUpdate(){
	}
}

//----------------------------------------------------------------------//