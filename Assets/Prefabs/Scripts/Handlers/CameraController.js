#pragma downcast

//Connect with our target ship
var target : Transform;
var cameraLocation : Transform;
var team : int;

//Drift we will "feel" with velocity change
var driftPos : Vector3 = Vector3(0, 0, 0);
var maxDrift : double = 0.3;
var driftPerSecond : double = 0.6;
var driftMaxAccelPull : float = 19.6; //Amount of force applied to max out drift 19.6 = 2 G's
var driftTolerance : float = 9.8; //when you get back to normal, 1g or less

//Camera shake for firing, thruster, and collisions (incorporate into ship datablocks)
var shakePos : Vector3 = Vector3.zero;
var shakeToPos : Vector3 = Vector3.zero;
var maxShake : float = 1;		//Max frequency of our shake
var shakeDecay : float = 1;		//shake freqency decay per second
var shakeDistance : float = 0.2;	//Distance we shake at full frequency
var currentShake : float = 0;	//current frequency of our shake
var shakeRange : Vector2 = Vector2(3, 10);  //Rapidity of shakes. Amount of jitters a second, lower number(left) is used for larger shakes.

//Temp GUI stuff.
var chTexture : Texture2D;
var positionch : Rect;

function Start(){
   updateTargetPosition();
}

function LateUpdate(){
   positionch = Rect((Screen.width - chTexture.width) / 2, (Screen.height - chTexture.height) / 2, chTexture.width, chTexture.height);
   
   if(currentShake > 0){
      currentShake -= Time.deltaTime * shakeDecay;
      if(currentShake < 0){
         shakePos = Vector3.zero;
         currentShake = 0;
      } else
         Effects.calcCameraShake(transform);
   }

   transform.position = cameraLocation.position + driftPos + shakePos;
   transform.rotation = cameraLocation.rotation;
}

function OnGUI(){
   GUI.DrawTexture(positionch, chTexture);
}

function updateTargetPosition(){
   for (var child : Transform in target) {
      if(child.name == "Camera"){
         cameraLocation = child;
         break;
      }
   }
}