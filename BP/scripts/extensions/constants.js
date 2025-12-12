/**
 * Turns the logic for inventory slots on/off. Only set this to false if you have disabled inventory in RP/ui/_global_variables.json side!
 * Disabling this may also reduce form opening lag a bit.
 */
export const inventory_enabled = true;
/**
 * Defines the custom block & item IDs for the form.
 * You can reference either a vanilla texture icon, which functions identically to other items...
 * ...or reference a texture path, which removes enchant glint and 3d block render capability.
 */
export const custom_content = {
	'tfg:pda': {
		 texture: 'textures/items/pda',
		 type: 'item'
	},
	'tfg:aphone': {
		 texture: 'textures/items/aphone',
		 type: 'item'
	},
	'tfg:cobblestphone': {
		 texture: 'textures/items/cobblestphone',
		 type: 'item'
	},
	'tfg:nebula_pro': {
		 texture: 'textures/items/nebula_pro',
		 type: 'item'
	},
	'tfg:admin_pda': {
		 texture: 'textures/items/admin_pda',
		 type: 'item'
	},
	'tfg:head_icon': {
		 texture: 'textures/tfg-icons-/items-/icons-/items-icons-head',
		 type: 'item'
	},
	'tfg:body_icon': {
		 texture: 'textures/tfg-icons-/items-/icons-/items-icons-body',
		 type: 'item'
	},
	'tfg:legs_icon': {
		 texture: 'textures/tfg-icons-/items-/icons-/items-icons-legs',
		 type: 'item'
	},
	'tfg:feet_icon': {
		 texture: 'textures/tfg-icons-/items-/icons-/items-icons-feet',
		 type: 'item'
	},
	'tfg:offhand_icon': {
		 texture: 'textures/tfg-icons-/items-/icons-/items-icons-offhand',
		 type: 'item'
	},
	'tfg:cursor_icon': {
		 texture: 'textures/tfg-icons-/items-/icons-/items-icons-cursor',
		 type: 'item'
	},
	/*
	'custom:block': {
		 texture: 'minecraft:gold_block',
		 type: 'block'
	},
	'custom:item': {
		 texture: 'textures/items/paper',
		 type: 'item'
	},
	*/
};
//Blocks are excluded from the count, as they do not shift vanilla IDs.
export const number_of_custom_items = Object.values(custom_content).filter(v => v.type === 'item').length;
export const custom_content_keys = new Set(Object.keys(custom_content));
//Add custom sizes defined in UI. Format is [key, [ui_flag, slot_count]]
export const CHEST_UI_SIZES = new Map([
	['single', ['§c§h§e§s§t§2§7§r', 27]], ['small', ['§c§h§e§s§t§2§7§r', 27]],
	['double', ['§c§h§e§s§t§5§4§r', 54]], ['large', ['§c§h§e§s§t§5§4§r', 54]],
	['1', ['§c§h§e§s§t§0§1§r', 1]],
	['5', ['§c§h§e§s§t§0§5§r', 5]],
	['9', ['§c§h§e§s§t§0§9§r', 9]],
	['18', ['§c§h§e§s§t§1§8§r', 18]],
	['27', ['§c§h§e§s§t§2§7§r', 27]],
	['36', ['§c§h§e§s§t§3§6§r', 36]],
	['45', ['§c§h§e§s§t§4§5§r', 45]],
	['54', ['§c§h§e§s§t§5§4§r', 54]],
	[1, ['§c§h§e§s§t§0§1§r', 1]],
	[5, ['§c§h§e§s§t§0§5§r', 5]],
	[9, ['§c§h§e§s§t§0§9§r', 9]],
	[18, ['§c§h§e§s§t§1§8§r', 18]],
	[27, ['§c§h§e§s§t§2§7§r', 27]],
	[36, ['§c§h§e§s§t§3§6§r', 36]],
	[45, ['§c§h§e§s§t§4§5§r', 45]],
	[54, ['§c§h§e§s§t§5§4§r', 54]]
]);

