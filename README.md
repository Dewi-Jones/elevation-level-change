With this module, changing a tkens elevation can also trigger a Level Change. Level Changes are only triggered in specific circumstances:

The token has to start in its current levels elevation range, or in an elevation that is not covered by any level.
The token ends its movement in a different levels elevation range, and not inside its current levels elevation range. In case of chained movement, the elevation of the last waypoint also has to fullfill this condition.
The Movement is not made via API or pasting (`CTRL + v`), assuming that the level would be set correctly as part of that action.

**Player Movement**

By default, Players can also trigger a Level Change. This can be disabled in the settings.

**Confirm Dialog**

In case you don't want to swap the tokens Level, you're prompted to confirm the Level Change. This can be disabled in the settings. If there are multiple possible levels to change to, the dialog appears regardless of the setting. The dialog itself is based on the core Change Level Region Behavior, and has been adapted to fit this usecase.

**View Level**

After the tokens Level was changed, the user (that moved the token) also changes the viewed Level. This can be disabled via a setting. If a player has no owned tokens left on the original level, their view is always changed regardless of this setting.

**Moving multiple tokens**

When moving multiple tokens at once, each token can trigger a Level Change separately.

**Modes & Collections**

_Special thanks to [Trill](https://foundryvtt.com/community/triull), who had the original Idea for this functionality, and allowed me to use it in my own publication._

Levels can have Modes, that determine how/if they interact with Elevation Level Changes. Included levels have no restrictions. Excluded levels don't interact at all (can't be reached or left by changing elevation). Origin and Destination interact only one way (can only be left or reached respectively by changing elevation).

Additionally, levels can have Collections. A level with Collections only interacts with other Levels that share at least one Collection with it. An example might be having a dungeon and an ethereal copy, where both have multiple levels. By giving them mismatching Collections, you can make sure that elevation changes are not a way of switching between the normal and ethereal versions. Levels without any Collections are considered to be included in all other Collections.

**Compatibility**

Trills [Global Auto Level Change](https://foundryvtt.com/packages/galc) is another module with the same purpose, along some additional functionality. The two modules take different approaches, so I highly recommend trying out both to see which one fullfills your needs and wants better. Do not use them simultaneously. 
