/// <reference path="./menubox2.d.js" />
/**
 * Pop-up menus.
 *
 * https://github.com/chzager/menubox
 * @copyright (c) 2024 Christoph Zager
 * @license MIT
 */

/**
 * An item of a menubox.
 * @template ContextType
 */
class Menubox2Item
{
	/**
	 * This menu items key.
	 * @type {string|undefined}
	 */
	key;

	/**
	 * Menubox that owns this menu item.
	 * @type {Menubox2<ContextType>}
	 */
	menubox;

	/**
	 * HTML element that represents this menu item.
	 * @type {HTMLElement}
	 */
	element;

	/**
	 * A submenu that opens on that menuitem.
	 *
	 * Menuitems with submenus do not trigger the callback nor do they close the
	 * menubox when clicked.
	 * @type {Menubox2}
	 */
	submenu;

	/**
	 * @param {Menubox2ItemProperties} properties Properties of the menu item.
	 * @param {Menubox2} parent Menubox that owns this menu item.
	 * If omitted, the default constructor function of `Menubox2Item` is used.
	 */
	constructor(properties, parent)
	{
		this.menubox = parent;
		this.key = properties.key;
		this.element = parent.itemRenderer.create(properties);
		if ((typeof properties.key === "string") && (properties.key !== ""))
		{
			this.element.dataset.key = properties.key;
			if (properties.submenu instanceof Object)
			{
				let submenuId = parent.id + "." + this.key;
				let submenuDef = Object.assign({}, properties.submenu, {
					adjustment: {
						horizontal: "after",
						vertical: "submenu-top" // “submenu-top” is reserved for submenus and is therefore not documented.
					},
					css: "submenubox",
					callback: parent.callback
				});
				this.submenu = new Menubox2(submenuId, submenuDef, parent);
				this.element.classList.add("submenuitem");
			}
			else if (typeof properties.callback === "function")
			{
				this.element.onclick = (evt) =>
				{
					evt.stopPropagation();
					if (this.enabled !== false)
					{
						properties.callback(this);
						this.menubox.close();
					}
				};
			}
		}
		this.element.onmouseenter = (evt) =>
		{
			this.menubox.closeSubmenus();
			if (this.submenu instanceof Menubox2)
			{
				Menubox2.currentSubmenuTimerId = setTimeout(
					() =>
					{
						this.submenu.popup(evt, this.menubox.context, this.element);
					},
					parent.submenuDelay);
			}
		};
		if (parent.isMultiselect)
		{
			this.element.classList.add("multiselect");
		}
		if (properties.checked === true)
		{
			this.element.classList.add("checked");
		};
		if (properties.enabled === false)
		{
			this.element.classList.add("disabled");
		};
	};

	/**
	 * Tells whether the item has the "checked" state or not.
	 */
	get checked ()
	{
		return this.element.classList.contains("checked");
	}
	set checked (val)
	{
		if (typeof val === "boolean")
		{
			this.element.classList.toggle("checked", (val === true));
		}
		else
		{
			throw new TypeError("Boolean value expected.");
		}
	}

	/**
	 * Tells whether the item is enabled or not. Disabled items do not trigger the callback when they are clicked.
	 * Only enabled items with a key trigger callbacks on clicks.
	 */
	get enabled ()
	{
		return (this.element.classList.contains("disabled") === false);
	}
	set enabled (val)
	{
		if (typeof val === "boolean")
		{
			this.element.classList.toggle("disabled", (val === false));
		}
		else
		{
			throw new TypeError("Boolean value expected.");
		}
	}

	/**
	 * The menu items label. This is the text that is being displayed in the document.
	 */
	get label ()
	{
		return this.element.textContent;
	}
}

/**
 * Base class for creating HTML elements that act as a menubox item on the UI.
 */
class Menubox2ItemRenderer
{
	/**
	 * For a menu item, this constructs its representing HTML element.
	 * @type {Menubox2ItemRenderFunction}
	 */
	create (itemProps)
	{
		let result = document.createElement("div");
		result.classList.add((!!itemProps.key) ? "menubox-item" : "menubox-label");
		if ((itemProps.cssClasses instanceof Array) && (itemProps.cssClasses.length > 0))
		{
			result.classList.add(...itemProps.cssClasses);
		}
		result.textContent = itemProps.label ?? itemProps.key ?? null;
		return result;
	}
}

/**
 * A menubox.
 * @template ContextType
 */
class Menubox2
{
	static SELECT_MODE = {
		normal: "normal",
		persistent: "persistent",
		multiselect: "multiselect",
		multiselect_interactive: "multiselect_interactive"
	};

	/**
	 * Map of all menubox instances.
	 * @static
	 * @type {Map<string, Menubox2>}
	 */
	static instances = new Map();

	/**
	 * Closes all menuboxes.
	 * @static
	 */
	static closeAll ()
	{
		for (let menubox of Menubox2.instances.values())
		{
			menubox.close();
		}
	};

	/**
	 * Default event handler for clicks on menu items. This triggers only for enabled items that have a `key` value.
	 *
	 * Depending on the menuboxes `selectMode` this fires the callback or closes the menubox.
	 *
	 * For menuboxes with any kind of multiselect, this toggles the "checked" state of the clicked menu item.
	 *
	 * @static
	 * @param {PointerEvent} event Event that has been triggered by clicking on the menu item.
	 * @param {Menubox2} menubox Menubox that has send this event.
	 */
	static onMenuItemClick (event, menubox)
	{
		let menuItem = menubox.items.get(event.target.closest(".menubox-item")?.dataset?.key);
		if ((menuItem) && (menuItem.enabled))
		{
			if (menubox.isMultiselect)
			{
				menuItem.checked = !menuItem.checked;
			}
			if (([Menubox2.SELECT_MODE.normal, Menubox2.SELECT_MODE.multiselect_interactive].includes(menubox.selectMode)) && (!menuItem.submenu) && (typeof menubox.callback === "function"))
			{
				menubox.callback(menuItem);
			}
			if (menuItem.submenu instanceof Menubox2)
			{
				menuItem.submenu.popup(event, menubox.context, menuItem.element);
			}
			else if (menubox.selectMode === Menubox2.SELECT_MODE.normal)
			{
				menubox.close();
			}
		}
	};

	/**
	 * This menuboxes HTML element on the document.
	 * @type {HTMLElement}
	 */
	element;

	/**
	 * This menuboxes menu items.
	 * @type {Map<string, Menubox2Item<ContextType>>}
	 */
	items;

	/**
	 * Renderer to create the HTML elements that represents a single menu item on the menu box.
	 * @type {Menubox2ItemRenderer}
	 */
	itemRenderer;

	/**
	 * Directives how to adjust this menubox to another element on the document.
	 * @type {Menubox2Adjustment}
	 */
	adjustment;

	/**
	 * Delay in milliseconds before a submenu is opened after it's parent menuitem was hovered. Default is `300`ms.
	 * @type {number}
	 */
	submenuDelay;

	/**
	 * Current context of the menubox. This is set on {@link popup()} or {@link toggle()}.
	 * @type {ContextType}
	 */
	context;

	/**
	 * Callback function for clicks on menu items.
	 * @type {Menubox2Callback}
	 */
	callback;

	/**
	 * @param {string} id Id of this menubox.
	 * @param {Menubox2Definition} options Definition of how this menubox is to be created.
	 * @param {Menubox2} [_parentMenubox] Parent menubox if this is a submenu. For internal use only!
	 */
	constructor(id, options, _parentMenubox = undefined)
	{
		/**
		 * Creates anew HTML element.
		 * @param {string} tagName
		 * @param {string} cssClass
		 * @param {string} [textContent]
		 * @returns {HTMLElement}
		 */
		function __newElement (tagName, cssClass, textContent)
		{
			/** @type {HTMLElement} */
			let result = document.createElement(tagName);
			result.classList.add(cssClass);
			if (textContent)
			{
				for (let xmlEntityRem of textContent.matchAll(/&#x([0-9a-f]+);/ig))
				{
					textContent = textContent.replace(xmlEntityRem[0], JSON.parse("\"\\u" + xmlEntityRem[1] + "\""));
				}
				result.appendChild(document.createTextNode(textContent));
			}
			return result;
		};
		/**
		 * Creates the items on this menubox.
		 * @private
		 * @param {Menubox2} self the very this menubox; for a clean code.
		 * @param {Array<Menubox2ItemProperties>} itemDefs Definitions of items to be created on the menubox.
		 */
		function __setItems (self, itemDefs)
		{
			self.items = new Map();
			let itemsContainer = __newElement("div", "menubox-items");
			for (let itemDef of itemDefs)
			{
				/** @type {HTMLElement} */
				let itemElement;
				if (itemDef.separator)
				{
					itemElement = __newElement("hr", "menubox-separator");
				}
				else
				{
					let menuItem = new Menubox2Item(itemDef, self);
					itemElement = menuItem.element;
					if (itemDef.key)
					{
						self.items.set(itemDef.key, menuItem);
					}
				}
				itemsContainer.appendChild(itemElement);
			}
			self.element.querySelector("div.menubox-wrapper").appendChild(itemsContainer);
		};
		if (Menubox2.instances.has(id))
		{
			console.info("Menubox \"" + id + "\" already existed, has been replaced.");
			document.body.querySelector("[data-menubox=\"" + id + "\"]")?.remove();
		}
		this.id = id;
		this.parentMenubox = _parentMenubox;
		this.selectMode = options.selectMode ?? Menubox2.SELECT_MODE.normal;
		this.callback = options.callback;
		this.itemRenderer = (options.itemRenderer instanceof Menubox2ItemRenderer) ? options.itemRenderer : new Menubox2ItemRenderer();
		this.adjustment = Object.assign({ horizontal: "left", vertical: "below" }, options.adjustment);
		this.transistions = Object.assign({ visibility: ["hidden", "visible"] }, options.transistions);
		this.submenuDelay = Math.max(options.submenuDelay || 300, 0);
		this.element = __newElement("div", "menubox"); // wrapper DIV is required for transistions
		this.element.dataset.menubox = id;
		this.element.appendChild(__newElement("div", "menubox-wrapper"));
		if (this.isMultiselect)
		{
			this.element.classList.add("menubox-multiselect");
		}
		this.element.style.position = options.position ?? "absolute";
		this.element.style.top = "0px";
		this.element.style.left = "0px";
		if (typeof options.css === "string")
		{
			this.element.classList.add(...options.css.split(" "));
		}
		document.body.appendChild(this.element);
		this.element.onclick = (evt) => Menubox2.onMenuItemClick(evt, this);
		this.element.onmouseleave = () => { if (Menubox2.currentSubmenuTimerId) { clearTimeout(Menubox2.currentSubmenuTimerId); } };
		__setItems(this, options.items ?? []);
		Menubox2.instances.set(this.id, this);
		Menubox2.closeAll();
	};

	/**
	 * Sets the visibility of the menubox.
	 *
	 * This method respects opening and closing animations vie transistions.
	 * @private
	 * @param {boolean} visible Whether the menubox is to be visible or to be hidden.
	 */
	_setVisibility (visible)
	{
		let styleIndex = (visible) ? 1 : 0;
		for (let transistionEntry of Object.entries(this.transistions))
		{
			let styleKey = transistionEntry[0];
			let styleValue = transistionEntry[1][styleIndex];
			if ((styleKey === "height") && (styleValue === "auto"))
			{
				styleValue = this.element.firstElementChild.offsetHeight + "px";
			}
			else if ((styleKey === "width") && (styleValue === "auto"))
			{
				styleValue = this.element.firstElementChild.offsetWidth + "px";
			}
			this.element.style[styleKey] = styleValue;
		}
	};

	/**
	 * Gives the very ancestor of a menubox, especially of a sub-menubox.
	 * @returns {Menubox2}
	 */
	get rootMenubox ()
	{
		return this.parentMenubox?.rootMenubox || this;
	}

	/**
	 * `true` if the menubox allows selecting multiple items in any way, otherwise `false`.
	 *
	 * Multiselect can be set in the options when creating a menubox to
	 * - `"multiselect"`: Allows selection of multiple items, but does not trigger the callback.
	 * - `"multiselect_interactive"`: Allows selection of multiple items. Every selection does trigger the callback.
	 *
	 * Multiselect-menuboxes do not close on clicking their items.
	 */
	get isMultiselect ()
	{
		return ([Menubox2.SELECT_MODE.multiselect, Menubox2.SELECT_MODE.multiselect_interactive].includes(this.selectMode));
	}

	/**
	 * Pops up the menubox.
	 * @param {PointerEvent} [mouseEvent] Triggering event. If this is triggered by a pointer event, this **must** be passed here, otherwise the menubox is closed immediately after opening.
	 * @param {ContextType} [context] Context in which the menubox was opened.
	 * @param {HTMLElement} [anchorElement] Element in document to which align the menubox. If omitted, the menubox is aligned to the pointer position.
	 */
	popup (mouseEvent, context = undefined, anchorElement = undefined)
	{
		/**
		 * @param {Menubox2} menubox This menubox.
		 * @param {HTMLElement} anchorElement Anchor element to adjust to.
		 */
		function _adjustToAnchor (menubox, anchorElement)
		{
			let anchorRect = anchorElement.getBoundingClientRect();
			let position = { x: 0, y: 0 };
			switch (menubox.adjustment.horizontal)
			{
				case "before":
					position.x = anchorRect.left - menubox.element.offsetWidth;
					break;
				case "right":
					position.x = anchorRect.right - menubox.element.offsetWidth;
					break;
				case "after":
					position.x = anchorRect.right;
					break;
				case "left":
				default:
					position.x = anchorRect.left;
					break;
			}
			switch (menubox.adjustment.vertical)
			{
				case "submenu-top":
					let menuboxStyle = window.getComputedStyle(menubox.element);
					position.y = anchorRect.top - Number.parseFloat(menuboxStyle.paddingTop) - Number.parseFloat(menuboxStyle.borderTopWidth);
					break;
				case "above":
					position.y = anchorRect.top - menubox.element.offsetHeight;
					break;
				case "top":
					position.y = anchorRect.top;
					break;
				case "bottom":
					position.y = anchorRect.bottom - menubox.element.offsetHeight;
					break;
				case "below":
				default:
					position.y = anchorRect.bottom;
					break;
			}
			/* rescpect scroll position for non-fixed elements */
			if (window.getComputedStyle(menubox.element).position !== "fixed")
			{
				position.y += window.scrollY;
				position.x += window.scrollX;
			}
			/* set position */
			menubox.element.style.top = Math.round(position.y) + "px";
			menubox.element.style.left = Math.round(position.x) + "px";
		};
		if (!this.parentMenubox)
		{
			Menubox2.closeAll();
		}
		let itemsElement = this.element.querySelector("div.menubox-items");
		let scrollPos = (this.element.style.position === "fixed") ? { top: 0, left: 0 } : { top: document.documentElement.scrollTop, left: document.documentElement.scrollLeft };
		itemsElement.scrollTo({ top: 0 });
		itemsElement.style.height = null;
		itemsElement.style.overflowY = null;
		if (mouseEvent instanceof MouseEvent)
		{
			mouseEvent.stopPropagation();
			if ((anchorElement instanceof HTMLElement) === false)
			{
				this.element.style.top = mouseEvent.clientY + scrollPos.top + "px";
				this.element.style.left = mouseEvent.clientX + scrollPos.left + "px";
			}
		}
		if (anchorElement instanceof HTMLElement)
		{
			_adjustToAnchor(this, anchorElement);
		}
		/* prevent menubox exceeds viewport */
		let elementRect = this.element.getBoundingClientRect();
		if (elementRect.right > visualViewport.width)
		{
			this.element.style.left = Math.round(Math.max(scrollPos.left, scrollPos.left + visualViewport.width - elementRect.width)) + "px";
		}
		if (elementRect.bottom > visualViewport.height)
		{
			this.element.style.top = Math.round(Math.max(scrollPos.top, scrollPos.top + visualViewport.height - elementRect.height)) + "px";
			if (elementRect.height > visualViewport.height)
			{
				itemsElement.style.height = (itemsElement.offsetHeight - (elementRect.height - visualViewport.height)) + "px";
				itemsElement.style.overflowY = "scroll";
			}
		}
		this.context = context;
		this._setVisibility(true);
	};

	/**
	 * Closes the menubox.
	 * @param {boolean} [closeSubmenus] If `true` all submenus of this box will be closed. Default `false`.
	 */
	close (closeSubmenus)
	{
		this._setVisibility(false);
		(closeSubmenus === true) ? this.closeSubmenus() : this.parentMenubox?.close();
	};

	/**
	 * Pops up the menubox if it is not yet opened. Closes the menubox if it is already opened.
	 * @param {PointerEvent} [mouseEvent] Triggering event. If this is triggered by a pointer event, this **must** be passed here, otherwise the menubox is closed immediately after opening.
	 * @param {ContextType} [context] Context in which the menubox was opened.
	 * @param {HTMLElement} [anchorElement] Element in document to which align the menubox. If omitted, the menubox is aligned to the pointer position.
	 * @returns {boolean} `true` if the menubox is being shon now, `false` if it was closed.
	 */
	toggle (mouseEvent, context = null, anchorElement = null)
	{
		mouseEvent.stopPropagation();
		let result = (this.element.style.visibility !== "visible");
		if (result === true)
		{
			this.popup(mouseEvent, context, anchorElement);
		}
		else
		{
			this.close(true);
		}
		return result;
	}

	/**
	 * Closes all submenus of this menubox.
	 * This menubox remain open.
	 */
	closeSubmenus ()
	{
		if (Menubox2.currentSubmenuTimerId)
		{
			clearTimeout(Menubox2.currentSubmenuTimerId);
		}
		for (let menuItem of this.items.values())
		{
			if (menuItem.submenu instanceof Menubox2)
			{
				menuItem.submenu.closeSubmenus();
				menuItem.submenu.close(true);
			}
		}
	}

	/**
	 * Returns an array with all items of this menubox that have the _checked_ status.
	 * @returns {Array<Menubox2Item>} Returns all items of this menubox that have the _checked_ status.
	 */
	getCheckedItems ()
	{
		let result = [];
		for (let menuItem of this.items.values())
		{
			if (menuItem.checked)
			{
				result.push(menuItem);
			}
		}
		return result;
	}
};

//#region Event listeners on clicks and keydows on the document to close menuboxes.
window.addEventListener("click", (mouseEvent) =>
{
	if (mouseEvent.target.closest("[data-menubox]") === null)
	{
		Menubox2.closeAll();
	}
});
window.addEventListener("keydown", (keyEvent) =>
{
	if (["Escape"].includes(keyEvent.code))
	{
		Menubox2.closeAll();
	}
});
//#endregion
