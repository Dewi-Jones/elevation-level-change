With this module, changing a Tokens elevation can also trigger a Level Change.
This only happens if a Token moves from inside to outside the current levels elevation range.
If this happens as part of a chained movement, any movement that happens after the level change is cancelled and has to be redone by the user.
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
The module tries to keep the selected tokens, but that's not always possible.
This can also get a bit clunky with the Confirm Dialog.
