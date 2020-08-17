#pragma downcast

public var team : int = 1;
public var thrusterLevel : double = 0;
public var rotation : Vector3 = Vector3.zero;
public var inrDmpOn : boolean = true;

public var afterburnerActive : boolean = false;
public var afterburnerUse : double = 0;
public var afterburnerWait : double = 0;
public var damage : double = 0;
public var armor : double = 0;
public var energy : double = 0;
public var state : String = "inactive";

public var playerControlled : boolean = false;
public var pcCamera : Transform;
public var lastDamage : GameObject;
public var deathTime : float;

public var triggerDown : boolean = false;
public var selectedWeapon : int = 1;
public var weapons : Array = new Array();
public var glow : Array = new Array(); //Replace with array so that we can accomidate multiple engines.

function Start(){
   var datablock : ShipDatablock = transform.GetComponent(ShipDatablock);
   gameObject.tag = datablock.type;
   armor = datablock.armor;
   
   var found : boolean = true;
   var zeros : String = "00"; 
   while(found){
      found = false;
      if (glow.length >= 99)
         zeros = "";
      else if(glow.length >= 9)
         zeros = "0";
      for (var child : Transform in transform) { //Replace with code to build light, and trail on said glow points.
         if(child.name == "Glow"+zeros+(glow.length+1)){
            glow.Push(child);
            found = true;
            break;
         }
      }
   }

   state = "active";
   
   energy = datablock.energyMax;
}

function FixedUpdate(){
   var datablock : ShipDatablock = transform.GetComponent(ShipDatablock);
   Ships.ApplyManuver(transform, this, datablock);
}

function Update(){
   if(state == "deathroll"){
      deathRoll();
      return;
   } else if(state != "active")
      return;

   var datablock : ShipDatablock = transform.GetComponent(ShipDatablock);
   if(playerControlled){
      Controls.PlayerShipControlHandler(transform, this, datablock);
      if(Input.GetButton("Fire1"))
         triggerDown = true;
      else
         triggerDown = false;
   }
   
   //Lets do our tick controls here
   if(afterburnerActive)
      afterburnerUse += Time.deltaTime / datablock.afterburnerHeatTime;
   else if(afterburnerUse > 0)
      afterburnerUse -= Time.deltaTime / datablock.afterburnerCoolTime;
   if(afterburnerWait > 0)
      afterburnerWait -= Time.deltaTime / datablock.afterburnerWait;
   if(afterburnerUse >= 1)
      afterburnerActive = false;
      
   //make sure we keep our numbers clean.
   if(afterburnerUse < 0) afterburnerUse = 0;
   if(afterburnerWait < 0) afterburnerWait = 0;
   
   if(energy < datablock.energyMax)
      energy += datablock.energyCharge * Time.deltaTime;
}

function deathRoll(){ //Moved death roll info into its own function, largely because its becoming a ever increasing item.
   //Check if we do explosions, if so lets handle those.

   //Ships.js has handled putting us into a spin with no control, removing our trail and other things. Now lets flicker that glow.
   for(var i : int = 0; i < glow.length; i++){
      var curGlow : Transform = glow[i];
      var engineLight : Light = curGlow.GetComponent(Light);
      if(Random.Range(0.0, 10.0) < 1){
         if(engineLight.intensity <= 0.0)
            engineLight.intensity = 0.5 + Random.value;
         else
            engineLight.intensity = 0;
      }
   }

   deathTime -= Time.deltaTime; //Count down death clock
   if(deathTime < 0)
      Ships.DestroyShip(gameObject, this); //Death clock Activate!
   return;
}