With this module, changing a Tokens elevation can also trigger a Level Change.
This only happens if a Token moves from inside to outside the current levels elevation range, and if there are valid other levels to switch to.
If this happens as part of a chained movement, pending movement is finished on the new level, but won't trigger a new Level Change.
A Level Change is not triggered when a Token is moved via API (any code) or pasted (`ctrl + v`), assuming that the level is set correctly as part of this action.

**Player Movement**

By default, Players can also trigger a Level Change.
This can be disabled in the settings.

**Confirm Dialog**

In case you don't want to change the Tokens Level, you're prompted to confirm the Level Change.
This can be disabled in the settings.
If there are multiple possible levels to change to, the dialog appears regardless of the setting.
The Dialog itself is based on the core Change Level Region Behavior, and has been adapted to fit this usecase.

**View Level**

After the Tokens Level was changed, the user also changes the viewed Level. This can be disabled via a setting. If a Player has no owned Tokens left on the original Level, their view is always changed.

**Moving multiple Tokens**

When moving multiple Tokens at once, each Token can trigger a Level Change on separately.

**Modes & Collections**

Special thanks to Trill (https://github.com/lucky-trill/galc) for the Idea for this functionality, and allowed me to use it in my own publication.

Levels can have Special Modes, that determine how/if they interact with Elevation Level Changes. `Included` Levels have no restrictions. `Excluded` Levels don't interact at all (can't be reached or left by changing elevation). `Origin` and `Destination` interact only one way (can only be left or reached respectively by changing elevation).

Additionally, Levels can have Collections. A Level with Collections only interacts with other Levels that share at least one Collection with it. An Example might be having a dungeon and an ethereal copy, where both have multiple levels. By giving them mismatching Collections, you can make sure that elevation changes are not a way of switching between the normal and ethereal versions. Levels without any Collections are considered to be included in all other Collections.
