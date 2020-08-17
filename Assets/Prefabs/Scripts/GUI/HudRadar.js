#pragma downcast

var detectionRange : int = 5000;

var fighterIcon : Texture2D;		//Passive sensor icon for fighters.
var corvetteIcon : Texture2D;		//Passive sensor icon for corvettes.
var capitalIcon : Texture2D;		//Passive sensor icon for capitals.

var targetIcon : Texture2D;			//Active target icon			
var targetBehindIcon : Texture2D;	//Active target behind Icon
var pursuerIcon : Texture2D;		//Attacker Icon
var pursuerBehindIcon : Texture2D;	//Attacker behind Icon

var baseColor : Color = Color.white;	//Generic color of the HUD. (Player selected)
var enemyColor : Color = Color.red;		//Hostile color, also player selectable
var friendlyColor : Color = Color.green; //Friendly color, To be player selectable.

var circleRadius : float = 200;		//These are tweakable values, but best left alone by the player.

var maxScaleRange : int = 1000;
var minScaleRange : int = 200;
var minScaleSize : float = 0.05;
var maxScaleSize : float = 0.15;

var cycleTime : float = 0;
var cycleCount : int = 0;
var cycleWait : float = 2.5;

var target : GameObject;					  //These are control variables
var hostiles : Array = new Array();
var efi = new Array(); var ffi = new Array();
var eci = new Array(); var fci = new Array();
var esi = new Array(); var fsi = new Array();

function Update(){
   if(Input.GetButtonDown("CycleTargets")){
      if(cycleTime + cycleWait >= Time.time){
         CycleHostiles(cycleCount);
         cycleCount++;
      } else {
         CycleHostiles(0);
         cycleCount = 1;
      }
      cycleTime = Time.time;
   }
}

function OnGUI(){
   var cc : CameraController = this.GetComponent(CameraController);

   //----------------------------------------------------------
   //Passive radar (aka passive markers for all ships in range)
   //----------------------------------------------------------
   var screenPos : Vector3 = Vector3.zero;
   var distance : float = 0;
   var distMod : float = 0;
   var mod : float = 0;
   var scale : Vector2 = Vector2.zero;
   var temp : Rect = Rect(0, 0, 0, 0);
   
   var fighters : GameObject[];
   fighters = GameObject.FindGameObjectsWithTag("Fighter");
   var corvettes : GameObject[];
   corvettes = GameObject.FindGameObjectsWithTag("Corvette");
   var capitals : GameObject[];
   capitals = GameObject.FindGameObjectsWithTag("Frigate");
   
   efi.clear(); ffi.clear();
   for(var fighter : GameObject in fighters){
      distance = Vector3.Distance(fighter.transform.position, transform.position);
      if(distance < detectionRange){
         screenPos = GetComponent.<Camera>().WorldToScreenPoint(fighter.transform.position);
         if(screenPos.z > 0){
            temp = GenerateTargetRectangle(fighterIcon, screenPos, distance);
            if(fighter.GetComponent(ShipHandler).team == cc.team)
               ffi.Push(temp);
            else
               efi.Push(temp);
         }
      }
   }
   
   eci.clear(); fci.clear();
   for(var corvette : GameObject in corvettes){
      distance = Vector3.Distance(corvette.transform.position, transform.position);
      if(distance < detectionRange){
         screenPos = GetComponent.<Camera>().WorldToScreenPoint(corvette.transform.position);
         if(screenPos.z > 0){
            temp = GenerateTargetRectangle(corvetteIcon, screenPos, distance);
            if(corvette.GetComponent(ShipHandler).team == cc.team)
               fci.Push(temp);
            else
               eci.Push(temp);
         }
      }
   }
   
   esi.clear(); fsi.clear();
   for(var capital : GameObject in capitals){
      distance = Vector3.Distance(capital.transform.position, transform.position);
      if(distance < detectionRange){
         screenPos = GetComponent.<Camera>().WorldToScreenPoint(capital.transform.position);
         if(screenPos.z > 0){
            temp = GenerateTargetRectangle(capitalIcon, screenPos, distance);
            if(capital.GetComponent(ShipHandler).team == cc.team)
               ffi.Push(temp);
            else
               efi.Push(temp);
         }
      }
   }

   if(target){
      var tIcon : Rect = Rect(0,0,0,0);
      distance = Vector3.Distance(target.transform.position, transform.position);
      if(distance < detectionRange){
         screenPos = GetComponent.<Camera>().WorldToScreenPoint(target.transform.position);
         if(screenPos.z > 0){
            tIcon = GenerateTargetRectangle(targetIcon, screenPos, distance);
         } else {
            //Do circle and triangle location information.
         }
      }
      if(target.GetComponent(ShipHandler).team == cc.team){
         GUI.color = friendlyColor;
      } else {
         GUI.color = enemyColor;
      }
      GUI.DrawTexture(tIcon, targetIcon);
      GUI.color = baseColor;
   }

   GUI.color = enemyColor;
   for (var rect : Rect in efi)
      GUI.DrawTexture(rect, fighterIcon);
   for (var rect : Rect in eci)
      GUI.DrawTexture(rect, corvetteIcon);
   for (var rect : Rect in esi)
      GUI.DrawTexture(rect, capitalIcon);
   
   GUI.color = friendlyColor;
   for (var rect : Rect in ffi)
      GUI.DrawTexture(rect, fighterIcon);
   for (var rect : Rect in fci)
      GUI.DrawTexture(rect, corvetteIcon);
   for (var rect : Rect in fsi)
      GUI.DrawTexture(rect, capitalIcon);
   
   GUI.color = baseColor;
}

function GenerateTargetRectangle(Icon : Texture2D, screenPos : Vector3, distance : float) : Rect{
   var distMod : float = maxScaleSize;
   if(distance > maxScaleRange)
      distMod = minScaleSize;
   else if(distance > minScaleRange){
      mod = ((distance - maxScaleRange) / (maxScaleRange - minScaleRange) * (maxScaleSize - minScaleSize));
      distMod = minScaleSize - mod;
   }
   screenPos = Vector3(screenPos.x, Screen.height - screenPos.y, screenPos.z);
   scale = Vector2(targetIcon.width * distMod, targetIcon.height * distMod);
   return Rect(screenPos.x - (scale.x / 2), screenPos.y - (scale.y / 2), scale.x, scale.y);
}

   //-----------------------------------------------------------
   //Active radar (aka selected, attackers, and inbound markers)
   //-----------------------------------------------------------
   //Active target icon
   //---Behind me icon
   //Attacking targets icons
   //---Behind me icon
   //Inbound Missile icons
   //---Behind me icon

   //cycle friendlies
   //---priority ships
   //---wingmen
   //---Friendlies list

function CycleHostiles(count : int){
   var cc : CameraController = this.GetComponent(CameraController);
   var aiHandler : AIHandler = cc.target.GetComponent(AIHandler);
   if(count == 0){
      hostiles.Clear();
      tempHostiles = GameObject.FindGameObjectsWithTag("Fighter");
      for(var ship : GameObject in tempHostiles)
         hostiles.Add(ship);
      //Copy above to corvettes and Capitals.

      var lowestAngle : float = 0.9;
      var lowestIndex : int = 0;
      for(var i : int = 0; i < hostiles.length; i++){
         var hostile : GameObject = hostiles[i];
         if(hostile == null){ //This doesnt exist, drop it.
            hostiles.RemoveAt(i);
            i--; continue;
         } else if(hostile.GetComponent(ShipHandler).team == cc.team){ //This isnt hostile, drop it.
            hostiles.RemoveAt(i);
            i--; continue;
         } else if(Vector3.Distance(hostile.transform.position, transform.position) > detectionRange){ //Check distance, remove those we cant actually see.
            hostiles.RemoveAt(i);
            i--; continue;
         }

         var dot : float = Vector3.Dot(transform.forward, Vector3.Normalize(hostile.transform.position - transform.position));
         if(dot > lowestAngle){
            lowestAngle = dot;
            lowestIndex = i;
         }
      }
      if(lowestAngle > 0.9){ //Something hostile by reticle, target it
         MakeTarget(hostiles[lowestIndex], aiHandler);
         return;
      } else //Nothing by reticle, move on to target an attacker.
         count++;
   }
   if(count <= aiHandler.targetedBy.length && aiHandler.targetedBy[(count - 1)] != null){
      MakeTarget(aiHandler.targetedBy[(count-1)], aiHandler);
   } else {
      if(hostiles.length == 0) //No hostiles spotted.
         return;
      if(count <= hostiles.length + aiHandler.targetedBy.length){
         MakeTarget(hostiles[(count - aiHandler.targetedBy.length)-1], aiHandler);
      } else {
         //Ok, your picky, and im lazy, pick the first one, and dump the current settings.
         MakeTarget(hostiles[0], aiHandler);
         cycleTime = 0;
         cycleCount = 0;
         hostiles.Clear();
      }
   }
}

function MakeTarget(selected : GameObject, aiHandler : AIHandler){
   if(selected == target)
      return;

   var cc : CameraController = this.GetComponent(CameraController);
   target = selected;
   aiHandler.target = target;
   var eAIh : AIHandler = target.GetComponent(AIHandler);
   eAIh.targetedBy.Push(cc.target.gameObject);
}