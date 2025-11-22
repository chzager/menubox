/**
 * @typedef Menubox2Definition
 * Definition of a menubox to being created.
 * @property {Array<Menubox2ItemDefinition|Menubox2Separator>} items List of items of this menubox.
 * @property {string} [css] Additional CSS classes. Single string, multiple entries separated by space.
 * @property {"absolute"|"fixed"} [position] Positioning of the menubox on the viewport.
 * - `"absolute"`: The menubox remains an the document position while scrolling. (Default)
 * - `"fixed"`: The menubox stays at the viewport position even if the document scrolls.
 * @property {Menubox2Alignment} [align] Directives how to align this menubox on popup to another element on popup.
 * @property {Menubox2Transitions} [transitions] CSS styles to apply on the menubox when opening. The first value is for closed state, the second value is for opened state. Remember to declare matching transitions in the CSS class of the menubox.
 * @property {keyof Menubox2.SELECT_MODE} [selectMode] Mode of how menubox items can be selected.
 * - `"normal"`: When an item is clicked, callback is called and the menubox closes. (default)
 * - `"persistent"`:  When an item is clicked, callback is called but the menubox remains opened, you need to close it manually.
 * - `"multiselect"`: When an item is clicked, its "checked" state toggels. The menubox remains opened until closed manually.
 * - `"multiselect_interactive"`: Like "multiselect", but every item click calls the callback so you can react on it.
 * @property {Menubox2Callback} [callback] Callback function on when a menubox item is clicked.
 * @property {(menubox: Menubox2<any>, event: PointerEvent) => void} [beforePopup] Event handler before the menu acutally pops up.
 * @property {Menubox2ItemRenderer} [itemRenderer] Function that creates the HTML elements of this menubox's items. Per default the native `Menubox2Item.htmlConstructor()` is used.
 * @property {number} [submenuDelay] Delay in milliseconds before a submenu is opened after its parent menu item was hovered. Default is `300`ms.
 *
 * @typedef {Object.<string, _Menubox2Transition>} Menubox2Transitions
 * CSS styles to apply on the menubox in closed or open state. Remember to declare matching transitions in the CSS for the menubox.
 * @typedef {Object} _Menubox2Transition
 * @property {string} opened Property value when the menubox is opened.
 * @property {string} closed Property value when the menubox is closed.
 *
 * @typedef Menubox2Alignment
 * Directives how to align a menubox to another element on the document.
 * @property {"before"|"left"|"right"|"after"} [horizontal] Alignment on the horizontal axsis. Default is `"right"`.
 * @property {"above"|"top"|"bottom"|"below"} [vertical] Alignment on the vertical axsis. Default is `"below"`.
 *
 * @callback Menubox2Callback
 * Callback function on when a menubox item is clicked.
 * @param {Menubox2Item} item The menubox item that has been clicked.
 * @returns {void}
 *
 * @typedef Menubox2ItemDefinition
 * Definition of a menubox item for creation.
 * @property {string} [key] Key of the item. Only items with a key trigger callbacks on clicks.
 * @property {string} [label] label of the item to be displayed on the menubox.
 * @property {Menubox2Callback} [callback] This menu item's individual _onclick_ callback function. If omitted, the menubox's callback is called.
 * @property {boolean} [checked] Whether the item has the `checked` state. (Default `false`)
 * @property {boolean} [enabled] Whether the item is enabled for clicks. Only enabled items with a key trigger callbacks on clicks. (Default `true`).
 * @property {Array<string>} [cssClasses] Additonal classes for the menu item.
 * @property {Menubox2Definition} [submenu] A submenu that expands when this menu item is hovered.
 * 		The ID of the submenu is auto-generated of the parent menubox ID and the key of the menu item.
 * 		So menu items with submenus are required to have a key.
 *
 * @typedef Menubox2Separator
 * A separator between menubox items.
 * @property {any} separator
 *
 * @callback Menubox2ItemRenderFunction
 * Function that creates an HTML element that represents a menu item.
 * @param {Menubox2ItemDefinition} itemProps Properties of the menu item to get its representing HTML element constructed.
 * @returns {HTMLElement} Returns an HTML element that represents the menu item.
 *
 */
