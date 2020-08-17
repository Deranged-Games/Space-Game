#pragma strict
var projectile : GameObject;
var fireRate : float = 0.1;
var firingType : String = "Normal"; //Normal, Salvo, Constant, Spinup, Charge
var salvoSize : int = 0; //Rounds fired in a salvo
var specialTime : float = 0; //Used for firing type, Salvo: time after salvo, Constant: firing time, Spinup: spinup time, Charge: charge up time.
var ammoType : String = "Energy"; //Energy, Belt, Magazine, Compound
var energyUse : int = 1; //Amount of energy used per shot, pulled before firing (charged capacitors)
var ammoAmount : int = 0; //Amount of ammo in each unit of space for that weapon (this also includes magazines, for magazine type.
var magazineSize : int = 0; //Amount of ammo in each magazine