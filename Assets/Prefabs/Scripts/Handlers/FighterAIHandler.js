#pragma downcast

var firingRange : int = 1000;
var weaponSpeed : int = 500;
var burst : float = 0;
var burstFire : boolean = true;
var targetBehind : boolean = true;
var manuverStep : int = 0;
var manuver : Array = null;
var inaccuracy : Vector3 = Vector3.zero;
var changedWeps : boolean = true;
var wing : Array = new Array();
var wingLeader : GameObject;
var formationPos : int = 0;
var formationIndex : int = 0;

function Start () {
   var aiHandler : AIHandler = this.GetComponent(AIHandler);
   var skill : int = aiHandler.skill;
   inaccuracy = Vector3(Random.Range(-FighterAI.accuracy[skill], FighterAI.accuracy[skill]), 
   						Random.Range(-FighterAI.accuracy[skill], FighterAI.accuracy[skill]), 
   						Random.Range(-FighterAI.accuracy[skill], FighterAI.accuracy[skill]));
}

function Update () {
   var datablock : ShipDatablock = transform.GetComponent(ShipDatablock);
   var sHandler : ShipHandler = transform.GetComponent(ShipHandler);
   
   if(!sHandler.playerControlled){
      //Lets figure out what the muzzle velocity is of our selected weapon.
      if(changedWeps){
         for(var i : int = 0; i < sHandler.weapons.length; i++){
            var weapon : GameObject = sHandler.weapons[i];
            var wHandler : WeaponHandler = weapon.GetComponent(WeaponHandler);
            if(wHandler.weaponSystem == sHandler.selectedWeapon){
               var wdb : WeaponDatablock = wHandler.GetComponent(WeaponDatablock);
               var projDB : ProjectileDatablock = wdb.projectile.GetComponent(ProjectileDatablock);
               weaponSpeed = projDB.muzzleVelocity;
            }   
         }
         changedWeps = false;
      }
   
      if(sHandler.triggerDown)
         burst += Time.deltaTime;
      else {
         if(burst > 0){
            burst -= Time.deltaTime;
            burstFire = false;
         } else
            burstFire = true;
      }
   }
}