/**
 * @typedef Menubox2Definition
 * Definition of a menubox to being created.
 * @property {string} [css] Additional CSS classes. Single string, multiple entries separated by space.
 * @property {"absolute" | "fixed"} [position] Positioning of the menubox on the viewport.
 * - `"absolute"`: The menubox remains an the document position while scrolling. (Default)
 * - `"fixed"`: The menubox stays at the viewport position even if the document scrolls.
 * @property {Menubox2Adjustment} [adjustment] Directives how to adjust this menubox on popup to another element on the document.
 * @property {Menubox2Transistion} [transistions] CSS styles to apply on the menubox in closed or open state. This is used for animations on opening/closing the menubox.
 * @property {keyof Menubox2.SELECT_MODE} [selectMode] Mode of how menubox items can be selected.
 * - `"normal"`: When an item is clicked, callback is called and the menubox closes. (default)
 * - `"persistent"`:  When an item is clicked, callback is called but the menubox remains opened, you need to close it manually.
 * - `"multiselect"`: When an item is clicked, it's "checked" state toggels. The menubox remains opened until closed manually.
 * - `"multiselect_interactive"`: Like "multiselect", but every item click calls the callback so you can react on it.
 * @property {Menubox2Callback} [callback] Callback function on when a menubox item is clicked.
 * @property {Array<Menubox2ItemProperties | Menubox2Separator>} [items] List of items of this menubox.
 * @property {Menubox2ItemRenderer} [itemRenderer] Function that creates the HTML elements of this menubox's items. Per default the native `Menubox2Item.htmlConstructor()` is used.
 * @property {number} [submenuDelay] Delay in milliseconds before a submenu is opened after it's parent menuitem was hovered. Default is `300`ms.
 *
 * @typedef Menubox2Adjustment
 * Directives how to adjust a menubox to another element on the document.
 * @property {"before"|"left"|"right"|"after"} [horizontal] Adjustment on the horizontal axsis. Default is `"right"`.
 * @property {"above"|"top"|"bottom"|"below"} [vertical] Adjustment on the vertical axsis. Default is `"below"`.
 *
 * @typedef Menubox2Transistion
 * // TODO: Proper implementation.
 * @type {{[key: string]: [string,string]}}
 *
 * @callback Menubox2Callback
 * Callback function on when a menubox item is clicked.
 * @param {Menubox2Item} item The menubox item that has been clicked.
 * @returns {void}
 *
 * @typedef Menubox2ItemProperties
 * Definition of a menubox item for creation.
 * @property {string} [key] Key of the item. Only items with a key trigger callbacks on clicks.
 * @property {string} [label] label of the item to be displayed on the menubox.
 * @property {boolean} [checked] Whether the item has the `checked` state. (Default `false`)
 * @property {boolean} [enabled] Whether the item is enabled for clicks. Only enabled items with a key trigger callbacks on clicks. (Default `true`).
 * @property {Array<string>} [cssClasses] Additonal classes for the menu item.
 * @property {Menubox2Definition} [submenu] A submenu that expands when this menuitem is hovered.
 * 		The ID of the submenu is auto-generated of the parent menubox ID and the key of the menuitem.
 * 		So menuitems with submenus are required to have a key.
 *
 * @typedef Menubox2Separator
 * A separator between menubox items.
 * @property {any} separator
 *
 * @callback Menubox2ItemRenderFunction
 * Function that constructs an HTML element that represents a menu item.
 * @param {Menubox2ItemProperties} itemProps Properties of the menu item to get its representing HTML element constructed.
 * @returns {HTMLElement} Returns an HTML element that represents the menu item.
 */
