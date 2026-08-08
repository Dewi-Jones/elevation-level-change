const id = "elevation-level-change";

Hooks.on("init", () => {
	
	game.settings.register(id, "playerMovement", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.playerMovement.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.playerMovement.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		requiresReload: false
	});
	
	game.settings.register(id, "skipDialog", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.skipDialog.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.skipDialog.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		requiresReload: false
	});
	
	game.settings.register(id, "viewLevel", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.viewLevel.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.viewLevel.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		requiresReload: false
	});
	
	game.settings.register(id, "defaultMode", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.defaultMode.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.defaultMode.hint",
		scope: "world",
		config: true,
		type: String,
		choices: {
			"excluded": "ELEVATION_LEVEL_CHANGE.CONFIG.mode.excluded",
			"destination": "ELEVATION_LEVEL_CHANGE.CONFIG.mode.destination",
			"origin": "ELEVATION_LEVEL_CHANGE.CONFIG.mode.origin",
			"included": "ELEVATION_LEVEL_CHANGE.CONFIG.mode.included"
		},
		default: "included",
		requiresReload: false
	});
});



Hooks.on("preMoveToken", (token, movement, operation) => {
	
	// If there's only one level, do nothing
	if ( token.parent.levels.size <= 1 ) return
	
	// Respect Player Movement Setting
	if ( !game.user.isGM && !game.settings.get(id, "playerMovement") ) return
	
	// Do nothing if Movement was done via API or pasting
	// Prevents recursive behaviour and undesired triggers like Teleports or Change Level Regions
	if ( movement.method === "api" || movement.method === "paste" ) return
	
	// If the token didn't move from inside to outside the current levels range, do nothing
	// If movement is chained, and ends within the current level's range, do nothing
	const originLevel = token.parent.levels.get(token._source.level);
	if ( !elevationInLevel(movement.origin.elevation, originLevel) ) return
	if ( elevationInLevel(movement.destination.elevation, originLevel) ) return
	if ( elevationInLevel(movement.pending.waypoints.at(-1)?.elevation, originLevel) ) return
	
	// If movement is chained, use the elevation of the last waypoint
	const destinationElevation = movement.pending.waypoints.at(-1)?.elevation ?? movement.destination.elevation;
	
	// If there is no viable level, do nothing
	const destinationLevels = token.parent.levels.filter(level => isDestinationLevel( level, originLevel, destinationElevation ));
	if ( destinationLevels.length === 0 ) return
	
	const currentAction = movement.passed.waypoints.at(-1).action;
	
	changeLevel( token, movement, destinationLevels, originLevel, currentAction )
	
	// Cancel triggering Movement
	return false
});

// Configuration for Level Collections and Modes
// Based on Trills GALC (https://github.com/lucky-trill/galc)
Hooks.on("renderLevelConfig", (app, elements, context, option) => {
	
	const level = app.document;
	if ( level.parent.levels.size <= 1 ) return
	
	const newFieldset = document.createElement("fieldset");
	newFieldset.className = id;
	
	const legend = document.createElement("legend");
	legend.innerText = "Elevation Level Change";
	newFieldset.append(legend);
	
	const modes = [
		{ value: "default", label: `${_loc("ELEVATION_LEVEL_CHANGE.CONFIG.mode.default")} (${_loc(`ELEVATION_LEVEL_CHANGE.CONFIG.mode.${game.settings.get(id, "defaultMode")}`)})` }, //0
		{ value: "excluded", label: "ELEVATION_LEVEL_CHANGE.CONFIG.mode.excluded" }, //1
		{ value: "destination", label: "ELEVATION_LEVEL_CHANGE.CONFIG.mode.destination" }, //2
		{ value: "origin", label: "ELEVATION_LEVEL_CHANGE.CONFIG.mode.origin" }, //3
		{ value: "included", label: "ELEVATION_LEVEL_CHANGE.CONFIG.mode.included" } //4
	];
	
	const collections = new foundry.data.fields.StringField({ 
		initial: level.getFlag(id, "collections") ?? "",
		label: "ELEVATION_LEVEL_CHANGE.CONFIG.collections.label",
		hint: "ELEVATION_LEVEL_CHANGE.CONFIG.collections.hint",
		placeholder: `${_loc("ELEVATION_LEVEL_CHANGE.CONFIG.collections.placeholder")}`
	}, {name: `flags.${id}.collections`});
	newFieldset.append(collections.toFormGroup({localize: true}, {localize: true}));
	
	const mode = new foundry.data.fields.StringField({ 
		initial: level.getFlag(id, "mode") ?? "default",
		choices: modes,
		required: true,
		label: "ELEVATION_LEVEL_CHANGE.CONFIG.mode.label",
		hint: "ELEVATION_LEVEL_CHANGE.CONFIG.mode.hint"
	}, {name: `flags.${id}.mode`});
	newFieldset.append(mode.toFormGroup({localize: true}, {localize: true}));
	
	const body = elements.querySelector('.standard-form[data-application-part="body"]')
	body.append(newFieldset);
});

async function changeLevel( token, movement, destinationLevels, originLevel, currentAction ) {
	
	// Get ID of Destination Level. If the Dialog was cancelled, set Origin Level as Destination Level
	const destinationLevelId = await confirmDialog( destinationLevels, token );
	const destinationLevel = destinationLevelId ? token.parent.levels.get(destinationLevelId) : originLevel;
	
	// Redo movement with the new destinationLevel. Only the first Level Change is actually triggered.
	const waypoints = movement.pending.waypoints.filter( w => !w.intermediate );
	waypoints.unshift(movement.passed.waypoints.at(-1));
	const newWaypoints = waypoints.map(( w, index ) => (index === waypoints.length - 1 ? { ...w, level: destinationLevel.id } : w ));
	await token.move(newWaypoints, { constrainOptions: movement.constrainOptions, autoRotate: movement.autoRotate, showRuler: movement.showRuler });
	
	if ( !game.settings.get(id, "viewLevel") ) return
	
	// The view isn't automatically changed for GM users or Players with another owned Token on the viewed level
	if ( token.rendered ) await token.object.movementAnimationPromise
	const controlledTokens = canvas.tokens.controlled.map(t => t.id);
	
	if ( game.user.isGM && token.parent.isView && canvas.level.id === originLevel.id ) await token.parent.view({ level: destinationLevel.id });

	if ( !game.user.isGM && token.parent.isView && canvas.level.id === originLevel.id ) {
		const ownedTokensOnLevel = canvas.scene.tokens
		.filter((t) => t.getUserLevel() === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && t.level === originLevel.id && t.id !== token.id)
		if ( ownedTokensOnLevel.length > 0 ) await token.parent.view({ level: destinationLevel.id });
	}
	
	controlledTokens.forEach( token => canvas.tokens.get(token)?.control({ releaseOthers: false }))
}

// Based on Cores Change Level Behavior Dialog
async function confirmDialog( levels, token ) {
	
	// Skip Confirmation Dialog if possible
	if ( game.settings.get(id, "skipDialog") && levels.length === 1 ) return levels[0].id
	
	const questionElement = window.document.createElement("p");
    questionElement.textContent = levels.length !== 1 ? _loc("BEHAVIOR.TYPES.changeLevel.ConfirmSelect", {token: token.name})
      : _loc("BEHAVIOR.TYPES.changeLevel.Confirm", {token: token.name, level: levels[0].name});
    const levelSelect = foundry.applications.fields.createFormGroup({
      label: _loc("BEHAVIOR.TYPES.changeLevel.Level"),
      input: foundry.applications.fields.createSelectInput({
        name: "level",
        options: levels.map(level => ({value: level.id, label: level.name})),
        disabled: levels.length <= 1
      }),
      classes: levels.length === 1 ? ["hidden"] : []
    });
    const content = window.document.createElement("div");
    content.append(questionElement, levelSelect);
    return foundry.applications.api.DialogV2.confirm({
      id: `dialog-${token.id}`,
      window: {
        icon: CONFIG.RegionBehavior.typeIcons.changeLevel,
        title: CONFIG.RegionBehavior.typeLabels.changeLevel
      },
      content,
      yes: {
        label: "BEHAVIOR.TYPES.changeLevel.Move",
        callback: (event, button) => (
          button.form.elements.level.value
        )
      },
      no: {label: "BEHAVIOR.TYPES.changeLevel.DoNotMove"}
    });
}

function isDestinationLevel( level, originLevel, elevation ) {
	
	// If the level is the origin level, it is not a valid option to swap to.
	if ( level.id === originLevel.id ) return false
	if ( !elevationInLevel(elevation, level) ) return false
	
	// Respect Modes and Collections
	const modes = { "0": game.settings.get(id, "defaultMode"), "1": "excluded", "2": "destination", "3": "origin", "4": "included" };
	const viableOriginModes = ["origin", "included"];
	const viableDestinationModes = ["destination", "included"];
	
	const originMode = originLevel.getFlag(id, "mode") in modes ? modes[originLevel.getFlag(id, "mode")] : originLevel.getFlag(id, "mode") ?? game.settings.get(id, "defaultMode");
	const originCollections = originLevel.getFlag(id, "collections")?.split(";") ?? [ "" ];
	
	const destinationMode = level.getFlag(id, "mode") in modes ? modes[level.getFlag(id, "mode")] : level.getFlag(id, "mode") ?? game.settings.get(id, "defaultMode");
	const destinationCollections = level.getFlag(id, "collections")?.split(";") ?? [ "" ];
	
	if ( !viableOriginModes.includes(originMode) ) return false
	if ( !viableDestinationModes.includes(destinationMode) ) return false
	if ( !originCollections ) return true
	if ( !destinationCollections ) return true
	if ( !originCollections.some(e => destinationCollections.includes(e)) ) return false
	
	return true
}

function elevationInLevel( elevation, level) {
	if ( elevation >= level.elevation.bottom && elevation < level.elevation.top ) return true
	return false
}