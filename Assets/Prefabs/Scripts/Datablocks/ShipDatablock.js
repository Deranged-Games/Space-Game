#pragma downcast
// Basic ship info
var type : String = "Fighter"; //Fighter, Corvette, Capital		How the game see us
var avoidance : String = "None"; //None, Capital, Static		How others avoid us

// Drive Components stuff
var thrust : int = 45; //Done in tons * Meters per Second squared.
var breakingThrust : int = 40; //Force appliable in other directions but forward.
var inertiaDampenerThrust : int = 35; //braking and slide dampening.
var maxForwardVelocity : int = 350; //Meters per second (fast)
var thrusterEngageTime : float = 1; //Time to manually move from 0 to 100 percent thrust 
var engineColor : Color = Color.cyan;

//Manuver Components
var maxPitchSpeed : int = 60;
var pitchForce : int = 150; 
var maxBankingSpeed : int = 90;
var bankingForce : int = 240; 
var maxRudderSpeed : int = 35;
var rudderForce : int = 80;

//Health and Combat
var hitpoints : int = 150;
var armor : int = 25;

//Death information
var expThreshold : int = 75; //Amount of damage PAST hitpoints it will explode even if mid deathroll
var deathTime : float = 7.5; //How long it takes to die after being... killed
var deathTimeVariance : float = 1.5; //Variation of death time. Because variety is the spice of life.

//Energy
var energyMax : int = 150;
var energyCharge : int = 8;

//Afterburner stuff
var afterburnerScaler : float = 2; //Multiplies thrust value by this for afterburners
var afterburnerMaxVelocity : int = 500; //Max speed while using afterburner.
var afterburnerHeatTime : float = 3; //Time in seconds the afterburner may be used until it overheats
var afterburnerCoolTime : float = 6; //Time in seconds the afterburner needs to cool off.
var afterburnerWait : float = 1; //Time in seconds between releasing the burner, and starting it up again.
var afterburnerColor : Color = Color.yellow;