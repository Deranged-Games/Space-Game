#pragma strict
//Projectile Basics
var projectileType : String = "Tracer"; //Tracer, seeking, instant, AOE
var muzzleVelocity : int = 500;		//Speed relative to the ship that it leaves the muzzle
var scale : Vector3 = Vector3(0.1, 0.1, 10); //Actual size of the round, in meters.
var mass : double = 0; // "# / 2000" because, well, its in tons... useful for larger ship projectiles
var life : float = 5; //Seconds to live!
var activationTime : double = 0.1; //DONT DO 0. It will eat you alive... literally.

//Damage information
var damage : int = 10;		//Amount of hitpoints taken from hull.
var armorPenetration : int = 5; //Amount of armor this round can penetrate with full damage. Damage can be dealt twice as deep as this, but damage falls off from this point to that one.
var armorDegrade : int = 1;     //Amount of armor points burned off by every hit.

//Explosion Damage stuff

//Explosion Effect stuff

//Sound Stuff

//Seeking Stuff
/*var isSeeking : boolean = false;	//For missiles
var turnForce : double = 0;		//amount of force applied to turning this beast
var maxTurnSpeed : int = 0;  //Max rate of turn
var flareFailDistance : int = 0; //Distance that countermeasures take effect.
var flareFailAngle : int = 0; //Angle that countermeasures take effect.
var accelForce : double = 0;

//Trail stuff

//Damage profile stuff. This is set so some weapons are better against certain ships than others.
var fighterDmgMod : double = 1.2;
var corvetteDmgMod : double = 1;
var frigateDmgMod : double = 0.6;
var destroyerDmgMod : double = 0;
var cruiserDmgMod : double = 0;
var shieldDmgMod : double = 0.6;	//Shields mitigate energy damage easily.
var repulsorDmgMod : double = 1.5;*/  //Repulsors mitigate ballistic damage easily.