#pragma downcast
var doDebug: boolean = false;

//Control
var status : String = "Pending";
var thinkStep : int = 0;
var thinkTime : float = 0;
var listsTime : float = 0;

//targeting
var target : GameObject;
var preference : String = "Fighter";
var prefTargetList : Array = new Array();
var secTargetList : Array = new Array();
var friendlysList : Array = new Array();
var goodTargets : Array = new Array();
var targetedBy : Array = new Array();
var engagementRange : int = 3500;
var targetsLastVelocity : Vector3 = Vector3.zero;

//Presence information
var fleetDetermine : int = 2000;
var friendlyPresence : int = 0;
var hostilePresence : int = 0;

//Variable from ship to ship
var skill : int = 1;
var stance : int = 1;

function Update(){
   var datablock : ShipDatablock = transform.GetComponent(ShipDatablock);
   var sHandler : ShipHandler = transform.GetComponent(ShipHandler);
   if(sHandler.state != "active")
      return;
   if(listsTime <= 0){
      BaseAI.GenerateTargetLists(gameObject, sHandler, datablock, this);
      BaseAI.DetermineThreatLevel(gameObject, this);
      BaseAI.CheckTargeters(gameObject, this);
      listsTime = 4.5 + Random.value;
   } else
      listsTime -= Time.deltaTime;

   if(!sHandler.playerControlled){
      if(thinkTime <= 0)
         BaseAI.Think(gameObject, sHandler, datablock, this);
      else
         thinkTime -= Time.deltaTime;
   }
}