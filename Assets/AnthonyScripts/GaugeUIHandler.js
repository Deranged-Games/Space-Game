#pragma strict
import UnityEngine.UI;

public var afterBurnerGauge : Image;
public var weaponEnergyGauge : Image;

public var healthBar : Image;

public var armorBar : Image;

var ship : GameObject;
var cameraController : CameraController;

var afterBurner : float = 0;
var weaponEnergy : float = 0;
var maxEnergy : float = 0;
var newAfterBurner : float = 0;
var newWeaponEnergy : float = 0;

var newHealth : float = 0;
var newArmor : float = 0;
var health : float = 0;
var damage : float = 0;
var armor : float = 0;
var armorMax : float = 0;
var anim : Animator;

function Start() {
	cameraController = gameObject.GetComponent(CameraController);
	ship = cameraController.target.gameObject;
	anim = GameObject.FindWithTag ("Canvas").GetComponent(Animator);
}

function Update() {
	ShipUpdate();
	EnergyUpdate();
	HealthUpdate();
	newAfterBurner = AfterBurnerConversion(afterBurner);
	newWeaponEnergy = WeaponEnergyConversion(weaponEnergy, maxEnergy);
	newHealth = HealthConversion(damage, health);
	newArmor = ArmorConversion(armor, armorMax);
	
	afterBurnerGauge.fillAmount = newAfterBurner;
	weaponEnergyGauge.fillAmount = newWeaponEnergy;
	healthBar.fillAmount = newHealth;
	armorBar.fillAmount = newArmor;
}

function AfterBurnerConversion(num : float) {
	var result : float = 0;
	
	result = (num - 1) * (-.205);
	
	return result;
}

function WeaponEnergyConversion(energy : float, maxEnergy : float) {
	var multiplier : float = (1 / maxEnergy) * .205;
	var result : float = 0;
	
	result = energy * multiplier;
	
	return result;
}

function HealthConversion(damage : float, health : float) {
	var multiplier : float = -1 / health;
	var result : float = 0;
	
	result = (damage - health) * multiplier;
	
	return result;
}

function ArmorConversion(armor : float, armorMax : float) {
	var multiplier : float = 1 / armorMax;
	var result : float = 0;
	
	result = armor * multiplier;
	
	return result;
}

function EnergyUpdate() {
	afterBurner = ship.GetComponent(ShipHandler).afterburnerUse;
	weaponEnergy = ship.GetComponent(ShipHandler).energy;
	maxEnergy = ship.GetComponent(ShipDatablock).energyMax;
}

function HealthUpdate() {
	health = ship.GetComponent(ShipDatablock).hitpoints;
	damage = ship.GetComponent(ShipHandler).damage;
	armor = ship.GetComponent(ShipHandler).armor;
	armorMax = ship.GetComponent(ShipDatablock).armor;
	
	if ((damage / health) >= .8) {
		anim.SetBool("LowHealth", true);
	}
	else if ((damage / health) <= .8) {
		anim.SetBool("LowHealth", false);
	}
}

function ShipUpdate() {
	cameraController = gameObject.GetComponent(CameraController);
	ship = cameraController.target.gameObject;
}