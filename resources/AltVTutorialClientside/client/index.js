/// <reference types ="@altv/types-client" />
/// <reference types ="@altv/types-natives" />


import * as alt from "alt-client"
import * as native from "natives"
import * as NativeUI from 'includes/NativeUIMenu/NativeUI.mjs';

//Variables
let loginHud;
let guiHud;
let lockHud;
let invHud;
let charHud;
let bodyCam;
let bodyCamStart;
let bodyCamSet = -1;

let showInv = false;

//Commands
alt.onServer('freezePlayer', (freeze) => {
    const lPlayer = alt.Player.local.scriptID;
    native.freezeEntityPosition(lPlayer, freeze);
})

//Login/Register
alt.onServer('CloseLoginHud', () => {
    alt.showCursor(false);
    alt.toggleGameControls(true);
    alt.toggleVoiceControls(true);

    if(loginHud)
    {
        loginHud.destroy();
    }
})

alt.onServer('SendErrorMessage', (text) => {
    loginHud.emit('ErrorMessage', text);
})

alt.on('connectionComplete', () => {
    loadBlips();

    guiHud = new alt.WebView("http://resource/gui/gui.html");

    loginHud = new alt.WebView("http://resource/login/login.html");
    loginHud.focus();

    alt.showCursor(true)
    alt.toggleGameControls(false)
    alt.toggleVoiceControls(false)

    loginHud.on('Auth.Login', (name, password) => {
        alt.emitServer('Event.Login', name, password);
    })

    loginHud.on('Auth.Register', (name, password) => {
        alt.emitServer('Event.Register', name, password);
    })
})

//UpdateMoneyHud
alt.onServer('updateMoneyHud', (money) => {
    guiHud.emit('updateMoneyHud', money);
})

//Notifications
alt.onServer('sendNotification', (status, text) => {
    guiHud.emit('sendNotification', status, text);
})

//Player Huds
alt.onServer('updatePB', (bar, wert) => {
    guiHud.emit('updatePB', bar, wert);
})

//Blips
function loadBlips()
{
    createBlip(-427.85934, 1115.0637, 326.76343,8,29,1.0,false,"Zivispawn");
}

function createBlip(x,y,z,sprite,color,scale=1.0,shortRange=false,name="")
{
    const tempBlip = new alt.PointBlip(x,y,z);

    tempBlip.sprite = sprite;
    tempBlip.color = color;
    tempBlip.scale = scale;
    tempBlip.shortRange = shortRange;
    if(name.length > 0)
    tempBlip.name = name;
}

//DrawText2D
function drawText2d( 
    msg,
    x,
    y,
    scale,
    fontType,
    r,
    g,
    b,
    a,
    useOutline = true,
    useDropShadow = true,
    layer = 0,
    align = 0
 ) {
    let hex = msg.match('{.*}');
    if (hex) {
        const rgb = hexToRgb(hex[0].replace('{', '').replace('}', ''));
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
        msg = msg.replace(hex[0], '');
    }
 
    native.beginTextCommandDisplayText('STRING');
    native.addTextComponentSubstringPlayerName(msg);
    native.setTextFont(fontType);
    native.setTextScale(1, scale);
    native.setTextWrap(0.0, 1.0);
    native.setTextCentre(true);
    native.setTextColour(r, g, b, a);
    native.setTextJustification(align);
 
    if (useOutline) {
        native.setTextOutline();
    }
 
    if (useDropShadow) {
        native.setTextDropShadow();
    }
 
    native.endTextCommandDisplayText(x, y, 0);
}

//GetCameraOffsetX
function getCameraOffsetX(posx, angle, dist)
{
    angle = angle * 0.0174533;
    return posx + dist * Math.cos(angle);
}

//GetCameraOffsetY
function getCameraOffsetY(posy, angle, dist)
{
    angle = angle * 0.0174533;
    return posy + dist * Math.sin(angle);
}

//Speedometer
function getSpeedColor(kmh) {
    if(kmh < 65)
        return "~g~";
    if(kmh >= 65 && kmh < 125)
        return "~y~";
    if(kmh >= 125)
        return "~r~";
}

//Native UI Vehiclespawner
alt.onServer('nativeUITest', () => {
    const ui = new NativeUI.Menu("Fahrzeug Spawner", "Spawne dir ein Fahrzeug", new NativeUI.Point(250,250));
    ui.Open();

    ui.AddItem(new NativeUI.UIMenuListItem(
        "Fahrzeug",
        "Fahrzeugbeschreibung",
        new NativeUI.ItemsCollection(["Kein Fahrzeug","Sultan","Infernus"])
    ));

    ui.ItemSelect.on(item => {
        if(item instanceof NativeUI.UIMenuListItem) {
            alt.emitServer('Event.SpawnVehicle', item.SelectedItem.DisplayText);
        }
    });
})

alt.everyTick(() => {
    const lPlayer = alt.Player.local;
    let vehicle = lPlayer.vehicle;
    if(vehicle)
    {
        let speed = vehicle.speed*3.6;
        speed = Math.round(speed);
        drawText2d(`${getSpeedColor(speed)}${speed} KMH`,0.45,0.91,1.5,2,255,255,255,255,true);
    }
    drawText2d('Nemesus.de', 0.5, 0.005, 0.5, 0, 255, 255, 255, 255);

    let getStreetHash = native.getStreetNameAtCoord(alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z, 0, 0);
    let streetName = native.getStreetNameFromHashKey(getStreetHash[1]);
    let zone = native.getFilenameForAudioConversation(native.getNameOfZone(alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z));

    drawText2d(`${streetName}\n${zone}`, 0.215, 0.925, 0.5, 4, 244, 210, 66, 255);
});

//Charcreator
alt.onServer('showCharCreator', () => {
    const lPlayer = alt.Player.local;

    charHud = new alt.WebView("http://resource/charcreator/index.html");
    charHud.focus();

    alt.showCursor(true);
    alt.toggleGameControls(false);
    alt.toggleVoiceControls(false);

    let camValues = {
        Angle: lPlayer.rot.z + 180,
        Dist: 1,
        Height: 0.2
    };

    bodyCamStart = lPlayer.pos;

    bodyCam = native.createCamWithParams('DEFAULT_SCRIPTED_CAMERA', getCameraOffsetX(bodyCamStart.x, camValues.Angle, camValues.Dist), getCameraOffsetY(bodyCamStart.y, camValues.Angle, camValues.Dist), lPlayer.pos.z + camValues.Height, 0, 0, 0, 50, 0, 0);
    
    native.setCamActive(parseFloat(bodyCam), true);
    native.renderScriptCams(true, false, 500, true, false, 0);
    native.setCamAffectsAiming(parseFloat(bodyCam), false);

    alt.emit('setCharCreatorCamera', 3);

    charHud.on('characterCustomize1', (flag, data) => {
        let getData = JSON.parse(data);
        switch(flag)
        {
            case 'hair': {
                alt.emit('setCharCreatorCamera', 1);
                native.setPedComponentVariation(lPlayer, 2, parseInt(getData[0]), 0, 0);
                break;
            }
            case 'faceFeatures': {
                alt.emit('setCharCreatorCamera', 2);
                native.setPedMicroMorph(lPlayer, 0, parseFloat(data[0]));
                native.setPedMicroMorph(lPlayer, 1, parseFloat(data[1]));
                native.setPedMicroMorph(lPlayer, 2, parseFloat(data[2]));
                native.setPedMicroMorph(lPlayer, 3, parseFloat(data[3]));
                native.setPedMicroMorph(lPlayer, 4, parseFloat(data[4]));
                native.setPedMicroMorph(lPlayer, 5, parseFloat(data[5]));
                native.setPedMicroMorph(lPlayer, 6, parseFloat(data[6]));
                native.setPedMicroMorph(lPlayer, 7, parseFloat(data[7]));
                native.setPedMicroMorph(lPlayer, 8, parseFloat(data[8]));
                native.setPedMicroMorph(lPlayer, 9, parseFloat(data[9]));
                native.setPedMicroMorph(lPlayer, 10, parseFloat(data[10]));
                native.setPedMicroMorph(lPlayer, 11, parseFloat(data[11]));
                native.setPedMicroMorph(lPlayer, 12, parseFloat(data[12]));
                native.setPedMicroMorph(lPlayer, 13, parseFloat(data[13]));
                native.setPedMicroMorph(lPlayer, 14, parseFloat(data[14]));
                native.setPedMicroMorph(lPlayer, 15, parseFloat(data[15]));
                native.setPedMicroMorph(lPlayer, 16, parseFloat(data[16]));
                native.setPedMicroMorph(lPlayer, 17, parseFloat(data[17]));
                native.setPedMicroMorph(lPlayer, 18, parseFloat(data[18]));
                native.setPedMicroMorph(lPlayer, 19, parseFloat(data[19]));
                break;
            }
            case 'clothing': {
                alt.emit('setCharCreatorCamera', 0);
                native.setPedComponentVariation(lPlayer, 11, parseInt(data[0]), 0, 0);
                native.setPedComponentVariation(lPlayer, 3, parseInt(data[1]), 0, 0);
                native.setPedComponentVariation(lPlayer, 4, parseInt(data[2]), 0, 0);
                native.setPedComponentVariation(lPlayer, 6, parseInt(data[3]), 0, 0);
            }
        }
    })
});

alt.on('setCharCreatorCamera', (flag) => {
    if(bodyCamSet == flag) return;
    const lPlayer = alt.Player.local;

    let camera = {
        Angle: lPlayer.rot.z + 180,
        Dist: 1,
        Height: 0.2,
    }

    switch(flag)
    {
        case 0: //Torso
        {
            camera = {
                Angle: lPlayer.rot.z + 180,
                Dist: 2.5,
                Height: 0.2
            };
            break;
        }
        case 1: //Kopf
        {
            camera = {
                Angle: lPlayer.rot.z + 180,
                Dist: 0.6,
                Height: 0.7
            };
            break;
        }
        case 2: //Gesicht
        {
            camera = {
                Angle: lPlayer.rot.z + 180,
                Dist: 0.5,
                Height: 0.2
            };
            break;
        }
        case 3: //Torso
        {
            camera = {
                Angle: lPlayer.rot.z + 180,
                Dist: 1,
                Height: 0.2
            };
            break;
        }
    }
    bodyCamSet = flag;
    bodyCamStart = lPlayer.pos;
    native.setCamCoord(parseFloat(bodyCam), getCameraOffsetX(bodyCamStart.x, camera.Angle, camera.Dist), getCameraOffsetY(bodyCamStart.y, camera.Angle, camera.Dist), bodyCamStart.z + camera.Height);
    native.pointCamAtCoord(parseFloat(bodyCam), bodyCamStart.x, bodyCamStart.y, bodyCamStart.z + camera.Height);
});

//Lockpicking
alt.onServer('showLockpicking', () => {
    lockHud = new alt.WebView("http://resource/lockpicking/lockpicking.html");
    lockHud.focus();

    alt.showCursor(true)
    alt.toggleGameControls(false)
    alt.toggleVoiceControls(false)

    lockHud.on('successLockpicking', () => {
        alt.emitServer('Event.successLockpickingServer');

        if(lockHud)
        {
            lockHud.destroy();
        }

        alt.showCursor(false)
        alt.toggleGameControls(true)
        alt.toggleVoiceControls(true)
    })

    lockHud.on('failedLockpicking', () => {
        alt.emitServer('Event.failedLockpickingServer');

        if(lockHud)
        {
            lockHud.destroy();
        }

        alt.showCursor(false)
        alt.toggleGameControls(true)
        alt.toggleVoiceControls(true)
    })
})

//Tastendrücke
alt.on('keydown', (key) => {
    if(key == 77)
    {
        alt.emitServer('Event.startStopEngine');
    }
})

alt.on('keydown', (key) => {
    if(key == 73)
    {
        if(showInv == false)
        {
            invHud = new alt.WebView("http://localhost:8080/");
            invHud.focus();
            showInv = true;

            alt.showCursor(true);
            alt.toggleGameControls(false);
            alt.toggleVoiceControls(false);
        }
        else
        {
            if(invHud)
            {
                invHud.destroy();
                showInv = false;
                alt.showCursor(false);
                alt.toggleGameControls(true);
                alt.toggleVoiceControls(true);
            }
        }
    }
})