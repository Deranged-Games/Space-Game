#pragma downcast

static var fighterValue = 5;
static var corvetteValue = 8;
static var frigateValue = 12;
static var aimRepairTime = 4;

static var reactionTime : float = 0.5;
static var aimTolerance : float = 10;

static var evasivePresenceThreshold : Array = new Array(0.75, 0.6, 0.5);
static var aggressivePresenceThreshold : Array = new Array(1.5, 1.75, 2);

static function Think(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler){
   switch(ship.tag){
      case "Fighter":
         FighterAI.Think(ship, sHandler, datablock, aiHandler);
         break;
   }
}

static function GenerateTargetLists(ship : GameObject, sHandler : ShipHandler, datablock : ShipDatablock, aiHandler : AIHandler){
   aiHandler.prefTargetList.clear();
   aiHandler.friendlysList.clear();

   var prefTrgs : GameObject[];
   prefTrgs = GameObject.FindGameObjectsWithTag(aiHandler.preference);
   for(var target : GameObject in prefTrgs){
      var dist : Vector3 = target.transform.position - ship.transform.position;
      if(dist.magnitude < aiHandler.engagementRange){
         if(target.GetComponent(ShipHandler).team != sHandler.team){
            aiHandler.prefTargetList.Push(target);
         } else {
            aiHandler.friendlysList.Push(target);
         }
      }
   }
   //Add generation of other ship types here.
   aiHandler.secTargetList.clear();
   if("Fighter" != aiHandler.preference)
      GenerateSpecificTargetList("Fighter", ship, sHandler, aiHandler);
   if("Corvette" != aiHandler.preference)
      GenerateSpecificTargetList("Corvette", ship, sHandler, aiHandler);
   if("Frigate" != aiHandler.preference)
      GenerateSpecificTargetList("Frigate", ship, sHandler, aiHandler);
}

static function GenerateSpecificTargetList(type : String, ship : GameObject, sHandler : ShipHandler, aiHandler : AIHandler){
   var targets : GameObject[];
   targets = GameObject.FindGameObjectsWithTag(type);

   for(var target : GameObject in targets){
      var dist : Vector3 = target.transform.position - ship.transform.position;
      if(dist.magnitude < aiHandler.engagementRange){
         if(target.GetComponent(ShipHandler).team != sHandler.team){
            aiHandler.secTargetList.Push(target);
         } else {
            aiHandler.friendlysList.Push(target);
         }
      }
   }
}

static function DetermineThreatLevel(ship : GameObject, aiHandler : AIHandler){
   var skill : int = aiHandler.skill;
   aiHandler.hostilePresence = 0;
   aiHandler.friendlyPresence = 0;
   for(var hostile : GameObject in aiHandler.prefTargetList){
      aiHandler.hostilePresence += DetermineSpecificThreat(hostile, ship, aiHandler);
   }
   for(var hostile : GameObject in aiHandler.secTargetList){
      aiHandler.hostilePresence += DetermineSpecificThreat(hostile, ship, aiHandler);
   }
   for(var friendly : GameObject in aiHandler.friendlysList){
      aiHandler.friendlyPresence += DetermineSpecificThreat(friendly, ship, aiHandler);
   }
   
   //Weve got our values, lets set our stance.
   if(aiHandler.hostilePresence != 0){
      var modifier = aiHandler.friendlyPresence / aiHandler.hostilePresence;
      if(modifier <= BaseAI.evasivePresenceThreshold[skill])
         aiHandler.stance = 0;
      else if(modifier < BaseAI.aggressivePresenceThreshold[skill])
         aiHandler.stance = 1;
      else
         aiHandler.stance = 2;
   } else
      aiHandler.stance = 1;
}

static function DetermineSpecificThreat(ship : GameObject, notShip : GameObject, aiHandler : AIHandler) : int{
   var threat : int = 0;
   var dist : Vector3 = ship.transform.position - notShip.transform.position;
   if(ship != notShip && dist.magnitude < aiHandler.fleetDetermine){
      switch(ship.tag){
         case "Fighter":
            threat = BaseAI.fighterValue;
            break;
         case "Corvette":
            threat = BaseAI.corvetteValue;
            break;
         case "Frigate":
            threat = BaseAI.frigateValue;
            break;
      }
   }
   return threat;
}

static function RemoveTargeter(ship : GameObject, targeter : GameObject){
   var aiHandler : AIHandler = ship.GetComponent(AIHandler);
   for(var i : int = 0; i < aiHandler.targetedBy.length; i++){
      if(aiHandler.targetedBy[i] == targeter){
         aiHandler.targetedBy.RemoveAt(i);
         return;
      }
   }
}

static function CheckTargeters(ship : GameObject, aiHandler : AIHandler){
   for(var i : int = 0; i < aiHandler.targetedBy.length; i++){
      if(aiHandler.targetedBy[i] == null){
         aiHandler.targetedBy.RemoveAt(i);
         i--;
      } else {
         hostileHandler = aiHandler.targetedBy[i].GetComponent(AIHandler);
         if(hostileHandler.target != ship){
            aiHandler.targetedBy.RemoveAt(i);
            i--;
         }
      }
   }
}

static function SetStatus(status : String, time : float, aiHandler : AIHandler){
   aiHandler.status = status;
   aiHandler.thinkTime = time;
}