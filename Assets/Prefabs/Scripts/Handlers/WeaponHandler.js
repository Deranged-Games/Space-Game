#pragma downcast
var ship : Transform;
var slot : int;
var weaponSystem : int;
var setPoint : Transform;
var velocity : Vector3;

var reloadInterval : double;
var specialInterval : float = 0;
var salvoCount : int = 0;
var specialFlag : boolean = true;

var muzzle : Array = new Array();
var currentMuzzle : int = 0;
var rounds : int;
var magazines : int;

function Start () {
   //Add to ship weapons var
   ship.GetComponent(ShipHandler).weapons.Push(this.gameObject);

   //Find our position
   var slotName : String = "Gunpoint"+slot.ToString();
   for (var child : Transform in ship) {
      if(child.name == slotName){
         setPoint = child;
         break;
      }  
   }

   //Figure out how many muzzles we have
   var found : boolean = true;
   while(found){
      found = false;
      for (var child : Transform in transform) {
         if(child.name == "Muzzle"+(muzzle.length+1)){
            muzzle.Push(child);
            found = true;
            break;
         }
      }
   }
}

function LateUpdate() {
   transform.position = setPoint.position;
   transform.rotation = setPoint.rotation;
   velocity = ship.GetComponent(Rigidbody).velocity;
}

function FixedUpdate() { 
   var datablock : WeaponDatablock = transform.GetComponent(WeaponDatablock);
   var sHandler : ShipHandler = ship.GetComponent(ShipHandler);
   var triggerDown : boolean = false;
   
   if(ship.GetComponent(ShipHandler).triggerDown && sHandler.selectedWeapon == weaponSystem)
      triggerDown = true;

   //Lets do our firing controls
   var projectile : GameObject;
   switch(datablock.firingType){
      case "Normal":
         if(reloadInterval <= 0 && triggerDown){
            projectile = Weapons.CreateProjectile(transform, this, datablock);
            reloadInterval = 1;
         }
         break;
      case "Spinup":
         if(triggerDown){
            if(reloadInterval <= 0){
               projectile = Weapons.CreateProjectile(transform, this, datablock);
               reloadInterval = 1;
            }
            if(specialInterval < 1)
               specialInterval += Time.fixedDeltaTime / datablock.specialTime;
         }
         break;
      case "Salvo":
         if(reloadInterval <= 0 && specialInterval <= 0 && (salvoCount > 0 || triggerDown)){
            projectile = Weapons.CreateProjectile(transform, this, datablock);
            reloadInterval = 1;
            salvoCount++;
         }
         break;
      case "Constant":
         if(triggerDown && reloadInterval <= 0){
            specialFlag = true;
            //update constant projectile
            specialInterval += Time.fixedDeltaTime / datablock.specialTime;
            if(specialInterval >= 1){
               reloadInterval = 1;
               specialInterval = 0;
            }
         } else {
            if(specialFlag){
               reloadInterval = specialInterval;
               specialInterval = 0;
               specialFlag = false;
            }
            //clear constant projectile
         }
         break;
      case "Charge":
         if(reloadInterval <= 0 && triggerDown){
            if(specialInterval >= 1){
               projectile = Weapons.CreateProjectile(transform, this, datablock);
               reloadInterval = 1;
               specialInterval = 0;
            } else
               specialInterval += Time.fixedDeltaTime / datablock.specialTime;
         }
         break;
   }
   
   
   
   //Lets do our salvo controller. Then run special degrade for other types.
   if(datablock.firingType == "Salvo"){
      if(salvoCount >= datablock.salvoSize){
         specialInterval = 1;
         salvoCount = 0;
      }
      if(specialInterval > 0)
         specialInterval -= Time.fixedDeltaTime / datablock.specialTime;
   } else if(!triggerDown && (datablock.firingType == "Constant" || datablock.firingType == "Spinup" || datablock.firingType == "Charge")){
      if(specialInterval > 0)
         specialInterval -= Time.fixedDeltaTime / datablock.specialTime;
      if(specialInterval <= 0)
         specialFlag = true;
   }
   
   //Do reload interval, stuff its mildly complex here because it incorporates ammunition usage aswell. (Cant reload without ammo!)
   if(reloadInterval > 0){
      var energyNeeded : double = datablock.energyUse * (Time.fixedDeltaTime / datablock.fireRate);
      var canDrop : boolean = false;
      if(datablock.ammoType == "Energy"){
         if(sHandler.energy >= energyNeeded){
            canDrop = true;
         }
      } else if(datablock.ammoType == "Belt" || datablock.ammoType == "Magazine"){
         if(reloadInterval == 1){
            if(rounds <= 0)
               return;
            rounds--;
         }
         canDrop = true;
      } else if(datablock.ammoType == "Compound"){
         if(sHandler.energy >= energyNeeded){
            if(reloadInterval == 1){
               if(rounds <= 0)
                  return;
               rounds--;
            }
            canDrop = true;
         }
      }
      if(canDrop){
         if(datablock.firingType == "Spinup"){
            if(specialInterval > 0){
               var modifier : double = 1 + ((1 - specialInterval) * 5);
               reloadInterval -= Time.fixedDeltaTime / (datablock.fireRate * modifier);
               if(datablock.ammoType == "Energy" || datablock.ammoType == "Compound")
                  sHandler.energy -= energyNeeded * (1 / modifier);
            }
         } else{
            if(datablock.ammoType == "Energy" || datablock.ammoType == "Compound")
               sHandler.energy -= energyNeeded;
            reloadInterval -= Time.fixedDeltaTime / datablock.fireRate;
         }
      }
   }
}