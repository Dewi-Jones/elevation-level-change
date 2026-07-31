Hooks.on("init", () => {
	
	game.settings.register("elevation-level-change", "playerMovement", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.playerMovement.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.playerMovement.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		requiresReload: false
	});
	
	game.settings.register("elevation-level-change", "skipDialog", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.skipDialog.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.skipDialog.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: false,
		requiresReload: false
	});
	
	game.settings.register("elevation-level-change", "viewLevel", {
		name: "ELEVATION_LEVEL_CHANGE.SETTINGS.viewLevel.name",
		hint: "ELEVATION_LEVEL_CHANGE.SETTINGS.viewLevel.hint",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		requiresReload: false
	});
});



Hooks.on("preMoveToken", (token, movement, operation) => {
	
	// Respect Player Movement Setting
	if ( !game.user.isGM && !game.settings.get("elevation-level-change", "playerMovement") ) return
	
	// Do nothing if Movement was done via API or pasting
	// Prevents recursive behaviour and undesired triggers like Teleports or Change Level Regions
	if ( movement.method === "api" || movement.method === "paste" ) return
	
	// If the token didn't move from inside to outside the current level's range, do nothing
	const originLevel = token.parent.levels.get(token._source.level);
	if ( movement.origin.elevation < originLevel.elevation.bottom || movement.origin.elevation >= originLevel.elevation.top ) return
	if ( movement.destination.elevation >= originLevel.elevation.bottom && movement.destination.elevation < originLevel.elevation.top ) return
	
	// If there is no viable level, do nothing
	const destinationLevels = getDestinationLevels( movement.destination.elevation, token );
	if ( destinationLevels.length === 0 ) return
	
	const currentAction = movement.passed.waypoints.at(-1).action;
	
	changeLevel( token, movement, destinationLevels, originLevel, currentAction )
	
	// Cancel triggering Movement
	return false
});

async function changeLevel( token, movement, destinationLevels, originLevel, currentAction ) {
	
	// Get ID of Destination Level. If the Dialog was cancelled, set Origin Level as Destination Level
	const { level: destinationLevelId } = await confirmDialog( destinationLevels, token );
	const destinationLevel = destinationLevelId ? token.parent.levels.get(destinationLevelId) : originLevel
	
	// Redo movement with the new destinationLevel
	await token.move({ 
		elevation: movement.destination.elevation,
		level: destinationLevel.id,
		x: movement.destination.x,
		y: movement.destination.y,
		action: currentAction
	});
	
	if ( !game.settings.get("elevation-level-change", "viewLevel") ) return
	
	// The view isn't automatically changed for GM users or Players with another owned Token on the viewed level
	const controlledTokens = canvas.tokens.controlled.map(t => t.id);
	
	if ( game.user.isGM && token.parent.isView && canvas.level.id === originLevel.id ) await token.parent.view({ level: destinationLevel.id });

	if ( !game.user.isGM && token.parent.isView && canvas.level.id === originLevel.id ) {
		const ownedTokensOnLevel = canvas.scene.tokens
		.filter((t) => t.getUserLevel() === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER && t.level === originLevel.id && t.id !== token.id)
		if ( ownedTokensOnLevel.length > 0 ) await token.parent.view({ level: destinationLevel.id });
	}
	
	controlledTokens.forEach( token => canvas.tokens.get(token)?.control({ releaseOthers: false }))
}

async function confirmDialog( levels, token ) {
	
	// Skip Confirmation Dialog if possible
	if ( game.settings.get("elevation-level-change", "skipDialog") && levels.length === 1 ) return { level: levels[0].id }
	
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
        callback: (event, button) => ({
          level: button.form.elements.level.value
        })
      },
      no: {label: "BEHAVIOR.TYPES.changeLevel.DoNotMove"}
    });
}

function getDestinationLevels( elevation, token ) {
	const destinationLevels = token.parent.levels.filter((l) => l.id !== token.level && elevation >= l.elevation.bottom && elevation < l.elevation.top);
	return destinationLevels
}