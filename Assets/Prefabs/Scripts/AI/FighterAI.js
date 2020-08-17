#pragma downcast

//Attack Style info, Evasive = 0, Normal = 1, Aggressive = 2;
//These are determined by the hostile threat to each ship in its area.
static var breakThreshold : Array = new Array(1000, 500, 0); //Distance that we break from a head on engagement
static var evadeHostile : Array = new Array(1, 2, 3); //Number of ships actively on us before we consider evading
static var evadeDamage : Array = new Array(1, 10, 50); //Percent damage needed before we evade (overrides number of hostiles)
static var evadeWeight : Array = new Array(50, 10, 5); //Chance, per active attacker, out of 1000, per step, that we will start to evade.
static var evadeDistance : Array = new Array(500, 300, 150); //Distance we consider effective attack.
static var capAttackJink : Array = new Array(60, 40, 0); //Percent of time we jink around while attacking a cap ship

//Skill info for fighters, Novice = 0, Intermediate = 1, Veteran = 2;
static var thinkTime : Array = new Array(2, 1.3, 0.5); //How long does it take us to think?
static var loseTargetChance : Array = new Array(40, 20, 5); //Percent chance we will lose a target when they get behind us.
static var aimArea : Array = new Array(8, 5, 3); //Area in which we will fire on enemies per 100 meters.
static var slowZone : Array = new Array(0.3, 0.1, 0.05); //Cone in which we go precise on targets.
static var turnSpeed : Array = new Array(0.8, 0.9, 1); //Max turn speed, by skill
static var presenceThreshold : Array = new Array(15, 10, 5); //What value fleets we will engage as good targets, no matter what.
static var evadeFrequency : Array = new Array(0.2, 1, 1.5); //Modifier making use evade, more or less frequently.
static var accuracy : Array = new Array(15, 8, 3); //Our ability to aim: meters offset at 100 meters.
static var aimDrag : Array = new Array(1.8, 1.4, 1.1); //Aim drag.
static var formation : Array = new Array(Vector3(60, 0, 120), Vector3(-60, 0, 120), Vector3(0, 60, -40)); //This is a formation shape for ships around its leader (they follow 20 meters behind it)

static function Think(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler){
   if(!ship) //Some thought goes into things to get here, so while it shouldnt be an issue, make sure.
      return;
   var skill : int = aiHandler.skill;
   var stance : int = aiHandler.stance;
   var fAIHandler : FighterAIHandler = ship.GetComponent(FighterAIHandler);
   
   //*****Make sure we arnt about to run into something
   
   //*****if a Missiles on us, ignore thought, evade evade evade!
   
   if(aiHandler.status != "Evade"){
      var doBreak : boolean = false;
      if(aiHandler.targetedBy.length >= 1){
         for(var engager : GameObject in aiHandler.targetedBy){
            dobreak = FighterAI.CheckAttack(engager, ship, sHandler, datablock, aiHandler, fAIHandler);
            if(doBreak)
               break;
         }
      }
   }
   
   switch(aiHandler.status){ //Avoiding, Attacking, FindingTarget, Pending, MoveToTarget, MoveInFormation, Manuver, AvoidMissile
      case "Attacking":
         if(aiHandler.target == null){
            BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (1 + Random.value), aiHandler);
            sHandler.triggerDown = false;
            return;
         }
         if(aiHandler.target.tag != aiHandler.preference){
            if(aiHandler.prefTargetList.length > 0){
               aiHandler.thinkStep = 0;
               BaseAI.SetStatus("FindingTarget", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
               return;
            }
         }
         //if(aiHandler.target.tag == "Fighter" || aiHandler.target.tag == "Corvette")
            Dogfight(ship, sHandler, datablock, aiHandler, fAIHandler);
         //else
            //Strafe(ship, sHandler, datablock, aiHandler, fAIHandler);
         break;
      case "FindingTarget":
         FighterAI.FindTarget(ship, sHandler, datablock, aiHandler);
         break;
      case "Pending": //We are pending a mission, so lets find one.
         //*****if we have an active order, lets follow that.
   
         //if not told what to do, find a target.
         aiHandler.thinkStep = 0;
         FighterAI.CheckWing(ship, sHandler, aiHandler, fAIHandler);
         if(aiHandler.prefTargetList.length > 0 || aiHandler.secTargetList.length > 0)	//Targets?
            BaseAI.SetStatus("FindingTarget", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
         else	//No, ok lets form up
            BaseAI.SetStatus("Formation", FighterAI.thinkTime[skill] / (1 + Random.value), aiHandler);
         break;
      case "MoveToTarget":
         FighterAI.MoveToTarget(ship, sHandler, datablock, aiHandler, fAIHandler);
         break;
      case "Break":
         FighterAI.Break(ship, sHandler, datablock, aiHandler, fAIHandler);
         break;
      case "Evade":
         FighterAI.EvadeController(ship, sHandler, datablock, aiHandler, fAIHandler);
         break;
      case "Formation":
         FighterAI.FormationController(ship, sHandler, datablock, aiHandler, fAIHandler);
         break;
   }
}

static function FindTarget(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler){
   var skill : int = aiHandler.skill;
   switch(aiHandler.thinkStep){
      case 0: //We got our lists lets see if we can find any good targets
         aiHandler.goodTargets.clear();
         for(var target : GameObject in aiHandler.prefTargetList){
            if(target != null){
               tHandler = target.GetComponent(AIHandler);
               var hostility : float = 2;
               if(tHandler.friendlyPresence > 0)
                  hostility = tHandler.hostilePresence / tHandler.friendlyPresence;
               if(hostility > 0.75 || tHandler.friendlyPresence < FighterAI.presenceThreshold[skill])
                  aiHandler.goodTargets.Push(target);
            }
         }
         aiHandler.thinkStep++;
         aiHandler.thinkTime = FighterAI.thinkTime[skill] / (3 + Random.value);
         break;
      case 1: //Weve been looking for good targets, lets see if weve got any to kill.
         if(aiHandler.goodTargets.length > 0){ //We have good targets, find closest one and engage.
            var closest : GameObject;
            var closestDist : int = 5000;
            for(var target : GameObject in aiHandler.goodTargets){
               if(target != null){
                  var dist : Vector3 = target.transform.position - ship.transform.position;
                  if(dist.magnitude < closestDist && target.GetComponent(AIHandler).targetedBy.length < 2){
                     if(target.tag != "Fighter"){
                        closestDist = dist.magnitude;
                        closest = target;
                     } else if(target.GetComponent(AIHandler).targetedBy.length < 2){
                        closestDist = dist.magnitude;
                        closest = target;
                     }
                  }
               }
            }
            if(closest){
               aiHandler.target = closest;
               BaseAI.SetStatus("MoveToTarget", 0, aiHandler);
               closest.GetComponent(AIHandler).targetedBy.Push(ship);
               return;
            }
         }
         aiHandler.thinkStep++;
         aiHandler.thinkTime = FighterAI.thinkTime[skill] / (3 + Random.value);
         break;
      case 2: //Ok, no good targets, any prefered targets to smite?
         if(aiHandler.prefTargetList.length > 0){
            var target : GameObject = null;
            var count : int = 0;
            while(target == null && count < 3){
               var selected : int = Random.Range(0, aiHandler.prefTargetList.length);
               target = aiHandler.prefTargetList[selected];
               count++;
            }
            //*****if its not an over engage, go evasive.
            if(count < 3){
               aiHandler.target = target;
               BaseAI.SetStatus("MoveToTarget", 0, aiHandler);
               target.GetComponent(AIHandler).targetedBy.Push(ship);
               return;
            }
         }
         aiHandler.thinkStep++;
         aiHandler.thinkTime = FighterAI.thinkTime[skill] / (3 + Random.value);
         break;
      case 3: //Blah, nothing, is there anything to shoot... please?
         if(aiHandler.secTargetList.length > 0){
            var secTarget : GameObject;
            var secCount : int = 0;
            while(secTarget == null && secCount < 3){
               var secSelected : int = Random.Range(0, aiHandler.secTargetList.length);
               secTarget = aiHandler.secTargetList[secSelected];
               secCount++;
            }
            //This is not our kind of target, go evasive.
            if(secCount < 3){
               aiHandler.target = secTarget;
               BaseAI.SetStatus("MoveToTarget", 0, aiHandler);
               secTarget.GetComponent(AIHandler).targetedBy.Push(ship);
               return;
            }
         }
         BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);//We found nothing, find something else to do.
         aiHandler.thinkTime = FighterAI.thinkTime[skill] / (3 + Random.value);
         break;
   }
}

static function MoveToTarget(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   var skill : int = aiHandler.skill;
   if(aiHandler.target == null){
      BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (1 + Random.value), aiHandler);
      return;
   }
   var trgTransform : Transform = aiHandler.target.transform;
   if((ship.transform.position - trgTransform.position).magnitude < fAIHandler.firingRange){
      BaseAI.SetStatus("Attacking", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
      return;
   }
   
   if(sHandler.afterburnerUse <= 0){
      sHandler.afterburnerActive = true;
   }
   
   FighterAI.MoveToPoint(trgTransform.position, ship, sHandler, datablock, aiHandler);
}

static function MoveToPoint(point : Vector3, ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler){
   var rotVector = Vector3.zero;
   var skill : int = aiHandler.skill;

   var trgVec : Vector3 = Vector3.Normalize(point - ship.transform.position);
   trgVec = ship.transform.InverseTransformDirection(trgVec);
   if(Mathf.Abs(trgVec.x) < FighterAI.slowZone[skill]){ //If within roll tolerance.
      if(Mathf.Abs(trgVec.y) > FighterAI.slowZone[skill]){ //Got some pitching to do, do it full.
         if(trgVec.y > 0)
            rotVector.x = -FighterAI.turnSpeed[skill];
         else
            rotVector.x = FighterAI.turnSpeed[skill];
      } else
         rotVector.x = trgVec.y * (-FighterAI.turnSpeed[skill] / FighterAI.slowZone[skill]); //Lets smooth out whats left to aim in.
         
      rotVector.y = trgVec.x * (FighterAI.turnSpeed[skill] / FighterAI.slowZone[skill]);//Lets rudder out the left/right now.
   } else {	//Not within roll tolerance, lets roll hard
      if(trgVec.x > 0)
         rotVector.z = -FighterAI.turnSpeed[skill];
      else 
         rotVector.z = FighterAI.turnSpeed[skill];
   }
   
   sHandler.thrusterLevel = 1;
   sHandler.rotation = rotVector;
}

static function Dogfight(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   var skill : int = aiHandler.skill; //Lets get our basic vars for this process.
   var stance : int = aiHandler.stance;
   var target : GameObject = aiHandler.target;
   var enemyTransform : Transform = target.transform;
   var trgVec : Vector3 = enemyTransform.position - ship.transform.position;
   var distance : float = trgVec.magnitude;
   
   if(distance > fAIHandler.firingRange){
      BaseAI.SetStatus("MoveToTarget", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
      sHandler.triggerDown = false;
      return;
   }
   
   var relVec : Vector3 = ship.transform.InverseTransformDirection(trgVec);		relVec = relVec.normalized;
   if(relVec.z > 0.3){ //Added this in to seriously cut down on cpu process when its not needed (aka, behind us)
      fAIHandler.targetBehind = false;
      
      var acceleration : Vector3 = Vector3.zero;
      var enemyRB : Rigidbody = target.GetComponent(Rigidbody);
      if(aiHandler.targetsLastVelocity.magnitude > 0){
         acceleration = enemyRB.velocity - aiHandler.targetsLastVelocity;
         acceleration *= (1 / Time.deltaTime); //We want the current acceleration per second
      }
      aiHandler.targetsLastVelocity = enemyRB.velocity;
   
      var mixedVelocity : Vector3 = enemyRB.velocity - ship.GetComponent(Rigidbody).velocity;
      var aimPos : Vector3 = Functions.VelocityPredict(mixedVelocity, trgVec, acceleration, distance, fAIHandler.weaponSpeed * FighterAI.aimDrag[skill]);
      
      aimPos += (trgVec + (fAIHandler.inaccuracy * distance/100));
      
      FighterAI.MoveToPoint(aimPos + ship.transform.position, ship, sHandler, datablock, aiHandler);
      if(sHandler.afterburnerUse <= 0){
         if(distance > 500)
            sHandler.afterburnerActive = true;
         else {
            var relVelocity : Vector3 = ship.transform.InverseTransformDirection(ship.GetComponent(Rigidbody).velocity);
            var tRelVelocity : Vector3 = ship.transform.InverseTransformDirection(enemyRB.velocity);
         
            if(tRelVelocity.z - relVelocity.z > 80)
               sHandler.afterburnerActive = true;
         }
      } else if(distance < 300)
         sHandler.afterburnerActive = false;
   
   
      var resultVec : Vector3 = aimPos - ship.transform.forward * aimPos.magnitude;
      var zone : float = (distance / 100) * FighterAI.aimArea[skill];
      if(distance < 100)
         zone = FighterAI.aimArea[skill];
      
      if(resultVec.magnitude < zone && fAIHandler.burstFire && fAIHandler.burst < 1)
         sHandler.triggerDown = true;
      else{
         sHandler.triggerDown = false;
         fAIHandler.inaccuracy = Vector3(Random.Range(-FighterAI.accuracy[skill],FighterAI.accuracy[skill]), 
         								Random.Range(-FighterAI.accuracy[skill],FighterAI.accuracy[skill]), 
         								Random.Range(-FighterAI.accuracy[skill],FighterAI.accuracy[skill]));
      }
   } else {
      if(fAIHandler.targetBehind){
         FighterAI.MoveToPoint(enemyTransform.position, ship, sHandler, datablock, aiHandler);
         sHandler.triggerDown = false;
      } else {
         var chance : float = Random.Range(0,100);
         if(chance < FighterAI.loseTargetChance[skill]){
            BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (1 + Random.value), aiHandler);
            return;
         }
         fAIHandler.targetBehind = true;
         aiHandler.thinkTime = FighterAI.thinkTime[skill] / (1 + Random.value);
      }
   }
}

static function Break(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   var skill : int = aiHandler.skill; //Lets get our basic vars for this process.
   var stance : int = aiHandler.stance;
   var target : GameObject = aiHandler.target;
   
   if(target == null){
      BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (1 + Random.value), aiHandler);
      sHandler.triggerDown = false;
      return;
   }
   
   var enemyTransform : Transform = target.transform;
   var trgVec : Vector3 = enemyTransform.position - ship.transform.position;
   var distance : float = trgVec.magnitude;
   
   if(distance > fAIHandler.firingRange){
      BaseAI.SetStatus("MoveToTarget", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
      sHandler.triggerDown = false;
      return;
   }
   
   var relVec : Vector3 = ship.transform.InverseTransformDirection(trgVec);		relVec = relVec.normalized;
   if(relVec.z > 0.1){ //If target is still directly in front of us.
      var escapeVec : Vector3 = ship.transform.forward - trgVec.normalized;//Lets makes a quick vector, AWAY from the attacker.
      escapeVec = (escapeVec.normalized * (distance * 0.1)) + (ship.transform.forward * distance); //Ok lets scale it out, so relative to ship forward
      escapeVec = escapeVec + ship.transform.position;//Now make it realitve to the world.
      FighterAI.MoveToPoint(escapeVec, ship, sHandler, datablock, aiHandler);
   } else { //Turned away enough now, lets attack again.
      BaseAI.SetStatus("Attacking", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
      return;
   }
}

static function CheckAttack(hostile : GameObject, ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler, fAIHandler : FighterAIHandler) : boolean{
   var evading : boolean = false;
   var skill : int = aiHandler.skill; var stance : int = aiHandler.stance;
   if(hostile == null)
      return;
   
   var tsHandler : ShipHandler = hostile.GetComponent(ShipHandler);
   if(tsHandler.triggerDown){
      var tHandler : AIHandler = hostile.GetComponent(AIHandler);
      var trgVec : Vector3 = hostile.transform.position - ship.transform.position;
      var damage = 100 * (sHandler.damage / datablock.hitpoints);
      var distance : float = trgVec.magnitude;
      
      var relVec : Vector3 = ship.transform.InverseTransformDirection(trgVec);		relVec = relVec.normalized;
      if(aiHandler.targetedBy.length >= FighterAI.evadeHostile[stance] || damage > FighterAI.evadeDamage[stance]){
         if(distance < FighterAI.evadeDistance[stance] && relVec.z < -0.5){
            var random : float = Random.Range(0,1000);
            if((FighterAI.evadeWeight[stance] * FighterAI.evadeFrequency[skill]) >= random){
               BaseAI.SetStatus("Evade", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
               fAIHandler.manuverStep = 0;
               fAIHandler.manuver = null;
               if(sHandler.lastDamage)
                  aiHandler.target = sHandler.lastDamage;
               sHandler.triggerDown = false;
               evading = true;
               return;
            }
         }
      }
   
      if(relVec.z > 0.8){
         if(distance < FighterAI.breakThreshold[stance]){
            BaseAI.SetStatus("Break", FighterAI.thinkTime[skill] / (5 + Random.value), aiHandler);
            sHandler.triggerDown = false;
            evading = true;
            return;
         }
      }
   }
   return evading;
}




//-----------------------------------------------------
//--------------------MANUVERS-------------------------
//-----------------------------------------------------
static var jinkLeft : Array = new Array(0, 1, 0, 45, 1, 
										0, -1, 0, 45, 1);
static var jinkRight : Array = new Array(0, -1, 0, 45, 1, 
										0, 1, 0, 45, 1);
static var breakUp : Array = new Array(-1, 0, 0, 90, 1);
static var breakDown : Array = new Array(1, 0, 0, 90, 1);
static var breakLeft : Array = new Array(0, 0, 1, 90, 1, 
										-1, 0, 0, 90, 1);
static var breakRight : Array = new Array(0, 0, -1, 90, 1, 
										-1, 0, 0, 90, 1);
static var reversal : Array = new Array(0, -0.1, -1, 45, 1, 
										-1, 0, 0, 90, 0.8,
										-1, -0.1, -1, 60, 0.3,
										-1, 0, 0, 45, 1);

static var manuversEasy : Array = new Array(FighterAI.jinkLeft, 20,
										FighterAI.jinkRight, 20,
										FighterAI.breakLeft, 12,
										FighterAI.breakRight, 12);
static var manuversMedium : Array = new Array(FighterAI.breakUp, 20,
										FighterAI.breakDown, 8);
static var manuversHard : Array = new Array(FighterAI.reversal, 5);



static function EvadeController(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   var skill : int = aiHandler.skill; var stance : int = aiHandler.stance;
   if(!aiHandler.target){
      BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (1 + Random.value), aiHandler);
      return;
   }
   if(fAIHandler.manuver){
      var base : int = fAIHandler.manuverStep * 5;
      if(base >= fAIHandler.manuver.length){
         BaseAI.SetStatus("Attacking", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
         return;
      }
      var rotation : Vector3 = Vector3(fAIHandler.manuver[base], fAIHandler.manuver[(base + 1)], fAIHandler.manuver[(base + 2)]);
      sHandler.rotation = rotation;
      sHandler.thrusterLevel = fAIHandler.manuver[(base + 4)];
      aiHandler.thinkTime = fAIHandler.manuver[(base + 3)] / datablock.maxPitchSpeed;
      fAIHandler.manuverStep++;
   } else {
      var i : int = 0;
      var weightE : int = 0;
      var weightM : int = 0;
      var weightH : int = 0;
      for(i = 1; i < manuversEasy.length; i += 2)
         weightE += manuversEasy[i];
      if(skill >= 1)
         for(i = 1; i < manuversMedium.length; i += 2)	//Here we generate this fighters manuver weight
            weightM += manuversMedium[i];
      if(skill >= 2)
         for(i = 1; i < manuversHard.length; i += 2)
            weightH += manuversHard[i];
      
      i = 1;
      var random : float = Random.Range(0,(weightE + weightM + weightH));
      if(random > weightE)
         random -= weightE;
      else{
         while(random > FighterAI.manuversEasy[i]){
            random -= FighterAI.manuversEasy[i];
            i += 2;
         }
         fAIHandler.manuver = new Array(FighterAI.manuversEasy[(i - 1)]);
         return;
      }
      if(random > weightM)
         random -= weightM;
      else{
         while(random > FighterAI.manuversMedium[i]){
            random -= FighterAI.manuversMedium[i];
            i += 2;
         }
         fAIHandler.manuver = new Array(FighterAI.manuversMedium[(i - 1)]);
         return;
      }
      while(random > FighterAI.manuversHard[i]){
         random -= FighterAI.manuversHard[i];
         i += 2;
      }
      fAIHandler.manuver = new Array(FighterAI.manuversHard[(i - 1)]);
      return;
   }
}

//-----------------------------------------------------
//--------------------WING CONTROLS--------------------
//-----------------------------------------------------

static function CheckWing(ship : GameObject, sHandler : ShipHandler, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   var i : int = 0;//Just for ease of not repeating, we will make them here. (lots of for loops)
   //First, do we have a wing built?
   if(fAIHandler.wing.length == 0){//Ok we dont have a wing, so it hasnt been assigned, and no other fighters have assiged us one, lets make our own.
      fAIHandler.wing.Push(ship);
      FighterAI.BuildWing(ship, sHandler, aiHandler, fAIHandler);
   }
   
   //Lets make sure everyones alive.
   for(i = 0; i < fAIHandler.wing.length; i++){
      if(!fAIHandler.wing[i]){//Hes not alive.
         fAIHandler.wing.RemoveAt(i);
         i--;
      }
   }
   
   //Do we have a living wing leader?
   if(!fAIHandler.wingLeader && fAIHandler.wing.length > 0){
     var leader : GameObject; var wing : GameObject; var wingHandler : FighterAIHandler;
     //See if the player is in our wing.
     for(i = 0; i < fAIHandler.wing.length; i++){ 
        wing = fAIHandler.wing[i];
        var wingSHandler : ShipHandler = wing.GetComponent(ShipHandler);
        if(wingSHandler.playerControlled){//He is, make him the leader
           leader = wing;
           break;
        }
     }
     if(!leader)//Hes not, make ME the leader, muahahahaha
        leader = ship;
     
     for(i = 0; i < fAIHandler.wing.length; i++){ //Push the choosen leader to the wing.
        wing = fAIHandler.wing[i];
        wingHandler = wing.GetComponent(FighterAIHandler);
        wingHandler.wingLeader = leader;
     }
   }
}

static function BuildWing(ship : GameObject, sHandler : ShipHandler, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   if(aiHandler.friendlysList.length <= 1)
      return;
   
   //Lets find good ships to add to wing (fighters who like to fight what we like)
   for(var i : int; i < aiHandler.friendlysList.length && fAIHandler.wing.length < 4; i++){
      var friendly : GameObject = aiHandler.friendlysList[i];
      if(friendly.tag == "Fighter"){
         var friendlyHandler : AIHandler = friendly.GetComponent("AIHandler");
         if(friendlyHandler.preference == aiHandler.preference){
            var friendlyFHandler : FighterAIHandler = friendly.GetComponent(FighterAIHandler);
            if(friendlyFHandler.wing.length == 0){
               AddShipToWing(friendly, ship, fAIHandler, friendlyFHandler);
            }
         }
      }
   }
   if(fAIHandler.wing.length == 1)
      fAIHandler.wing.Clear();
}

static function AddShipToWing(friendly : GameObject, ship : GameObject, fAIHandler : FighterAIHandler, friendlyFHandler : FighterAIHandler){
   var i : int = 0;
   var wing : GameObject;
   for(i = 0; i < fAIHandler.wing.length; i++){
      wing = fAIHandler.wing[i];
      friendlyFHandler.wing.Push(wing);
   }
   for(i = 0; i < fAIHandler.wing.length; i++){
      wing = fAIHandler.wing[i];
      var wingHandler : FighterAIHandler = wing.GetComponent(FighterAIHandler);
      wingHandler.wing.Push(friendly);
   }
}

static function FormationController(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler, fAIHandler : FighterAIHandler){
   var skill : int = aiHandler.skill;
   var leader : GameObject = fAIHandler.wingLeader;
   var leaderHandler : FighterAIHandler = leader.GetComponent(FighterAIHandler);
   if(aiHandler.prefTargetList.length > 0 || aiHandler.secTargetList.length > 0){
      BaseAI.SetStatus("Pending", FighterAI.thinkTime[skill] / (3 + Random.value), aiHandler);
      fAIHandler.formationPos = 0;
      leaderHandler.formationIndex = 0;
      return;
   }
   if(leader == ship)
      return;//*****Go to patrol instead
   if(fAIHandler.formationPos == 0){
      leaderHandler.formationIndex++;
      fAIHandler.formationPos = leaderHandler.formationIndex;
   }
   
   var trgPoint : Vector3 = FighterAI.formation[(fAIHandler.formationPos - 1)];
   trgPoint = leader.transform.TransformDirection(trgPoint);
   trgPoint += leader.transform.position;
   var lrb : Rigidbody = leader.GetComponent(Rigidbody);
   
   FighterAI.Taxi(trgPoint, lrb.velocity, leader.transform.forward, leader.transform.up, ship, sHandler, datablock, aiHandler);
}

static function Taxi(point : Vector3, targetVelocity : Vector3, forward : Vector3, up : Vector3, ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler){
   var skill : int = aiHandler.skill;
   
   var trgSpeed : float = targetVelocity.magnitude;
   var trgVec : Vector3 = point - ship.transform.position;
   //var distance : float = trgVec.magnitude;
   var modifier : float = 3 - (trgSpeed / datablock.maxForwardVelocity);
   targetVelocity += (trgVec / modifier);
   var trgThrust : float = targetVelocity.magnitude / datablock.maxForwardVelocity;
   var rb : Rigidbody = ship.GetComponent(Rigidbody);
   var speed : float = rb.velocity.magnitude;
   
   FighterAI.MoveToPoint(targetVelocity + ship.transform.position, ship, sHandler, datablock, aiHandler);
   
   sHandler.thrusterLevel = trgThrust;
   
   if(trgThrust > 1.05 && trgSpeed > speed && sHandler.afterburnerUse <= 0){
      sHandler.afterburnerActive = true;
   } else if(trgSpeed < speed || trgThrust < 1)
      sHandler.afterburnerActive = false;  
}