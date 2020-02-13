const Entity = require('./entity.js');
const Bullet = require('./bullet.js');



module.exports = class Player extends Entity{
	constructor(GLOBALS,id,x,y){
		if(arguments.length>2){
			super(x,y);
			this.alive = true;
			this.in = true;
		}else{
			super();
			this.alive = false;
			this.in = false
		}
		this.id = id;
		this.number = "" + Math.floor(10 * Math.random());
		this.key = {right: false, left: false, up: false, 
			down: false, shoot: false};
		this.mouseAngle = 0;
		this.maxSpd = 5;
		this.acc = 0.7;
		this.walk = {count:10, frame:1};
		this.walking = false;
		this.jump = {count:10, frame:1};
		this.jumping = false;
		this.state = 'walk';
		this.facingRight = true;
		this.shootCd = 0;
		this.gun = 'normal';
		this.slot = -1;
		this.armorKey = 0;
		this.hitbox = {px:this.x-5, py:this.y-19, width:27, height:49, 
			xoff: -5, yoff: -19};
		this.maxHp = 100;
		this.hp = this.maxHp;
		this.canJump = true;
		GLOBALS.players[id] = this
	}

	respawn(GLOBALS){
		var j = Player.chooseSpawn(this.armorKey);

		GLOBALS.spawn.slots[j] = true;
		this.hp = this.maxHp;
		this.state = 'walk';
		this.walk = {count:10, frame:1};
		this.jump = {count:10, frame:1};
		this.alive = true;
		this.gun = 'normal';
		this.x = GLOBALS.spawn.points[j].x - this.hitbox.xoff - Math.ceil(this.hitbox.width/2);
		this.y = GLOBALS.spawn.points[j].y;
		this.armorKey = Math.floor(j/2);
		this.facingRight = (j<2) ? true : false;
		
	}

	p_update(GLOBALS){
		for(var i in Player.list){
			var inc_player = Player.list[i];
			if(this.collision(inc_player)){
			}
		}
		for(var i in GLOBALS.bullets){
			var inc_bullet = GLOBALS.bullets[i];
			if(inc_bullet.team != this.armorKey &&
			this.collision(inc_bullet)){
				inc_bullet.toRemove = true;
				if(this.hp>0)
					this.hp -= inc_bullet.dmg[inc_bullet.type];
			}
		}
		if(this.hp<=0){
			this.alive = false;
			this.x = -1000;
			this.y = 1000;
			this.hp = 100;
			this.hitboxUpdate();
			GLOBALS.kills[(this.armorKey+1)%2]++;
		}
		for(var i in GLOBALS.pickups){
			var pickup = GLOBALS.pickups[i];
			if(this.collision(pickup)){
				pickup[pickup.effect](this);
				delete GLOBALS.pickups[i];
			}
		}
		this.updateSpd()
		
		update_sprite(this,'walk');
		update_sprite(this,'jump');
		
		super.update();

		if(this.shootCd == 0){
			if(this.key.shoot)
				this.shootGun();
		}else this.shootCd--;
	} 

	updatePosition(){
		var xMax = this.x + this.spdX;
		var yMax = this.y + this.spdY + 0.5 * this.acc; //this.y+this.spdY;
		var newY, newX;
		var colX = false; var colY = false;
		for(var i in GLOBALS.platforms){
			var inc_platform = GLOBALS.platforms[i];

			// Y collision
			this.y += this.spdY;
			if(this.collision(inc_platform)){
				colY = true;
				if(this.spdY>0){
					this.jumping = false;
					this.canJump = true;
					this.state = 'walk';
					newY = inc_platform.hitbox.py - this.hitbox.height 
					- this.hitbox.yoff;
				}else{
					newY = inc_platform.hitbox.py + inc_platform.hitbox.height
					- this.hitbox.yoff;
				}
				this.spdY = 0;
			}
			this.y -= this.spdY;
			
			if(colY)
				break;
		}
		this.y = !colY ? yMax : newY;

		for(var a in GLOBALS.platforms){
			var inc_platform = GLOBALS.platforms[a];
			// X collision
			this.x += this.spdX;
			if(this.collision(inc_platform)){
				colX = true;
				if(this.spdX > 0){
					newX = inc_platform.hitbox.px - this.hitbox.width
					- this.hitbox.xoff;
				}else{
					newX = inc_platform.hitbox.px+inc_platform.hitbox.width
					- this.hitbox.xoff;
				}
			}else if(this.hitbox.px <= 0){
				colX = true;
				this.x  = -this.hitbox.xoff;
			}else if(this.hitbox.px + this.hitbox.width >= 890){
				colX = true;
				this.x = 890 - this.hitbox.xoff - this.hitbox.width;
			}
			this.x -= this.spdX;

			if(colX)
				return;
		}
		this.x = !colX ? xMax : newX;

	}

	shootGun(){
		var dir = this.facingRight ? 0 : 180;
		switch(this.gun){
			case 'normal':
				this.shootBullet(dir,10,5,'rgb(0,180,255)',1,0,-10);
				this.shootCd = 5;
				break;
			case 'cone':
				for(var i = -2; i < 3; i++) this.shootBullet(dir+i*3,8,5,'rgb(255,50,50)',1,0,-9);
				this.shootCd = 5;
				break;
			case 'wallbang':
				this.shootBullet(dir,40,4,'rgb(255,0,255)',5,-38,-1);
				this.shootCd = 1;
		}
		
	}

	shootBullet(angle,width,height,color,vel,r_off,l_off){
		var b = new Bullet(GLOBALS, this, angle, vel);
		b.x = this.facingRight ? this.x + 10 + r_off : this.x + l_off;
		b.y = this.y+10;
		b.hitbox.width = width;
		b.hitbox.height = height;
		b.color = color;
		b.type = this.gun; 
	}

	collision(object){
		if(object==this) return false;

		//Update hitboxes
		this.hitboxUpdate();
		object.hitboxUpdate();

		//p.Left < o.Right && o.Lelf < p.Right
		if(this.hitbox.px < object.hitbox.px+object.hitbox.width
			&& object.hitbox.px < this.hitbox.px + this.hitbox.width){
			//p.Top < o.Bottom && o.Top < p.Bottom
			if(this.hitbox.py < object.hitbox.py + object.hitbox.height
				&& object.hitbox.py < this.hitbox.py + this.hitbox.height){
				return true;
			}
		}
		return false;
	}
	hitboxUpdate(){
		this.hitbox.px = this.x-5;
		this.hitbox.py = this.y-19;
	}

	updateSpd(){
		if(this.key.right){
			this.spdX = this.maxSpd;
			this.facingRight = true;
		}else if(this.key.left){
			this.spdX = -this.maxSpd;
			this.facingRight = false;
		}else 
			this.spdX = 0;

		if(this.key.up && this.canJump){
			this.spdY = -13;
			this.jumping = true;
			this.canJump = false;
			this.state = 'jump';
		}
		this.spdY += this.acc;

		if(this.spdX != 0){
			this.walking = true;
		}
		else
			this.walking = false;
	}
}

//----------------------------------------------------------------------//

var update_sprite = function(player,type){
	switch(type){
		case 'walk':
			var bool_type = 'walking';
			var max_count = 45;
			var default_count = 1;
			break;
		case 'jump':
			var bool_type = 'jumping';
			var max_count = 15;
			var default_count = 15;
			break;
	}

	if(player[bool_type]){
		if(player[type].count < max_count){
			player[type].count++;
		}else{
			player[type].count = default_count;
		}
		player[type].frame = Math.ceil(player[type].count/5);
	}else{
		player[type].count = 1;
		player[type].frame = 1;
	}

}

