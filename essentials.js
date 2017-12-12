//another essentials
//it is a modification to https://github.com/TeraProxy/ and https://github.com/pinkipi
//use prime battle solution instead of everful nostrum on the elite bar
//for non-elite users in all regions i guess, the item codes of prime nostrum should be same
//avoid the potential waste on CCB every log in
//it checks your CCB after everytime you spawn in the map instead because your buffs will be fully loaded at that moment.

const  BUFF_NOSTRUM = [4020, 4021, 4030, 4031];
	//4020,4022 : prime nostrum buff for DPS/tanks
	//4021,4023 : prime nostrum buff for healers
	//4030,4032 : everful nostrum for DPS/tanks
	//4031,4033: everful nostrum for healers
	BUFF_CCB = [4610, 5020003]	//CCB buff
	
const sysmsg = require('tera-data-parser').sysmsg,
	Command = require('command');

module.exports = function Essentials(dispatch) {
	const command = Command(dispatch);
	let	player = null,
		timeout = null,
		timeoutCCB = null,
		cooldown = 0,
		bgZone = -1,
		alive = false,
		mounted = false,
		inContract = false,
		inBG = false,
		hasNostrum = false,
		hasCCB = false,
		enabled = true
	let	amountNostrum = 0;
	let	amountCCB = 0;
	let idNostrum = null;
	let idCCB = null;
	let elite = false;
	let idElite = null;

	dispatch.hook('S_LOGIN', 9, event => {
		player = event;
		amountNostrum = 0;
		amountCCB = 0;
		idNostrum = null;
		idCCB = null;
		hasNostrum = false;
		hasCCB = false;
		elite = false;
		idElite = null;
	});
	
	dispatch.hook('S_RETURN_TO_LOBBY', 1, event => {
		hasNostrum = false;
		hasCCB = false;
		player = null;
		alive = false;
	});
	
	dispatch.hook('S_INVEN', 11, { order: -10 }, (event) => {
        if (!enabled) return;
		if (event.first) {
			amountNostrum = 0;
			amountCCB = 0;
			idNostrum = null;
			idCCB = null;
			elite = false;
			idElite = null;
		}
        let tempInv = event.items;
        for (i = 0; i < tempInv.length; i++) {
            if (tempInv[i].dbid == 200999) {
                amountNostrum += tempInv[i].amount;
                if(!idNostrum) idNostrum = tempInv[i].id.low;
            }
			if (tempInv[i].dbid == 70000) {
				amountCCB += tempInv[i].amount;
				if(!idCCB) idCCB = tempInv[i].id.low;
			}
			if (tempInv[i].dbid == 201022) {
				elite = true;
				idElite = tempInv[i].id.low;
			}
        }
    });

	dispatch.hook('S_ABNORMALITY_BEGIN', 2, (event) => {
		if(event.target - player.gameId != 0) return;
		if(BUFF_NOSTRUM.includes(event.id)){
			clearTimeout(timeout);
			hasNostrum = true;
		}
		if(BUFF_CCB.includes(event.id)) {
			clearTimeout(timeoutCCB);
			hasCCB = true;
		}
	});
	
	dispatch.hook('S_ABNORMALITY_REFRESH', 1, (event) => {
		if(event.target - player.gameId != 0) return;
		if(BUFF_NOSTRUM.includes(event.id)) {
			clearTimeout(timeout);
			hasNostrum = true;
		}
		if(BUFF_CCB.includes(event.id)) {
			clearTimeout(timeoutCCB);
			hasCCB = true;
		}
	});
		
	dispatch.hook('S_ABNORMALITY_END', 1, (event) => {
		if(event.target - player.gameId != 0) return;
		if(BUFF_NOSTRUM.includes(event.id)) {
			clearTimeout(timeout);
			hasNostrum = false;
			timeout = setTimeout(nostrum,1000);
		}
		if(BUFF_CCB.includes(event.id)) {
			clearTimeout(timeoutCCB);
			hasCCB = false;
			timeoutCCB = setTimeout(ccb,1000);
		}
	});

	dispatch.hook('S_BATTLE_FIELD_ENTRANCE_INFO', 1, event => { bgZone = event.zone })
	dispatch.hook('S_LOAD_TOPO', 2, event => {
		mounted = false;
		inContract = false;
		inBG = event.zone == bgZone;
	})
	
	dispatch.hook('S_SPAWN_ME', 1, event => {
		if(event.target - player.gameId == 0){
			mounted = false;
			inContract = false;
			alive = event.alive
			if(alive){
				clearTimeout(timeout);
				clearTimeout(timeoutCCB);
				timeout = setTimeout(nostrum,2000);
				timeoutCCB = setTimeout(ccb,2000);
			}
		}
	})
	dispatch.hook('S_CREATURE_LIFE', 1, event => {
		if(event.target - player.gameId == 0 && (alive != event.alive)) {
			alive = event.alive;
			if(!alive) {
				mounted = false;
				inContract = false;
				clearTimeout(timeout);
				clearTimeout(timeoutCCB);
			}
			else{
				clearTimeout(timeout);
				clearTimeout(timeoutCCB);
				timeout = setTimeout(nostrum,1000);
				timeoutCCB = setTimeout(ccb,2000);
				 // You defenitely need a new nostrum after getting resurrected without teleport/spawn
				 // Town res will trigger SPAWN check instead of this clause clause i don't know why but it doesn't matter, you will still get rebuff
			}
		}
	})
	dispatch.hook('C_PLAYER_LOCATION', 2, { order: -10 }, (event) => {
        player.x = (event.x + event.toX) / 2;
        player.y = (event.y + event.toY) / 2;
        player.z = (event.z + event.toZ) / 2;
        player.w = event.w;
    })

	dispatch.hook('S_MOUNT_VEHICLE', 1, (event) => {
		if(event.target - player.gameId != 0) return;
		clearTimeout(timeout);
		clearTimeout(timeoutCCB);
		mounted = true;
	});
	
	dispatch.hook('S_UNMOUNT_VEHICLE', 1, (event) => {
		if(event.target - player.gameId != 0) return;
		mounted = false;
		clearTimeout(timeout);
		clearTimeout(timeoutCCB);
		timeout = setTimeout(nostrum,1000);
		timeoutCCB = setTimeout(ccb,2000);
	});

	dispatch.hook('S_REQUEST_CONTRACT', 1, (event) => {
		if(event.senderID - player.gameId != 0 && event.recipientId - player.gameId != 0) return;
		clearTimeout(timeout);
		clearTimeout(timeoutCCB);
		inContract = true;
	});
		
	dispatch.hook('S_ACCEPT_CONTRACT', 1, (event) => {
		if(event.senderID - player.gameId != 0 && event.recipientId - player.gameId != 0) return;
		inContract = false;
		clearTimeout(timeout);
		clearTimeout(timeoutCCB);
		timeout = setTimeout(nostrum,1000);
		timeoutCCB = setTimeout(ccb,2000);
	});
	
	dispatch.hook('S_REJECT_CONTRACT', 1, (event) => {
		if(event.senderID - player.gameId != 0 && event.recipientId - player.gameId != 0) return;
		inContract = false;
		clearTimeout(timeout);
		clearTimeout(timeoutCCB);
		timeout = setTimeout(nostrum,1000);
		timeoutCCB = setTimeout(ccb,2000);
	});
	
	dispatch.hook('S_CANCEL_CONTRACT', 1, (event) => {
		inContract = false;
		clearTimeout(timeout);
		clearTimeout(timeoutCCB);
		timeout = setTimeout(nostrum,1000);
		timeoutCCB = setTimeout(ccb,2000);
	});

	function nostrum() {
		clearTimeout(timeout)
		if(!hasNostrum && (amountNostrum>0 || elite)){
			if(alive && !mounted && !inContract && !inBG) {
				useNostrum();
			}
		}
	}
	
	function ccb() {
		clearTimeout(timeoutCCB)
		if(!hasCCB && amountCCB>0){
			if(alive && !mounted && !inContract && !inBG) {
				useCCB();
			}
		}
	}

	function useNostrum() {
		if(!enabled) return
		dispatch.toServer('C_USE_ITEM', 1, {
			ownerId: player.gameId,
			item: (elite ? 201022 : 200999),
			id: (elite ? idElite : idNostrum),
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1,
			unk5: 0,
			unk6: 0,
			unk7: 0,
			x: player.x, 
			y: player.y, 
			z: player.z, 
			w: player.w, 
			unk8: 0,
			unk9: 0,
			unk10: 0,
			unk11: 1
		})
	}
	
	function useCCB() {
		if(!enabled) return
		dispatch.toServer('C_USE_ITEM', 1, {
			ownerId: player.gameId,
			item: 70000,
			id: idCCB,
			unk1: 0,
			unk2: 0,
			unk3: 0,
			unk4: 1,
			unk5: 0,
			unk6: 0,
			unk7: 0,
			x: player.x, 
			y: player.y, 
			z: player.z, 
			w: player.w, 
			unk8: 0,
			unk9: 0,
			unk10: 0,
			unk11: 1
		})
	}
	/* debugger */
	command.add(['status'], () => {
		command.message('--essentials-status--');
		command.message('alive: '+alive);
		command.message('hasNostrum: '+hasNostrum);
		command.message('hasCCB: '+hasCCB);
		command.message('mounted: '+mounted);
		command.message('inContract: '+inContract);
		command.message('inBG: '+inBG);
		command.message('elite: '+elite);
		command.message('Number of nostrums remaining: '+ amountNostrum);
		command.message('Number of CCBs remaining: '+ amountCCB);
	});
}