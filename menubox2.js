/**
 * Menubox - pop-up GUI elements as menus for web applications.
 * @version 1.0.0
 * @copyright (c) 2024 Christoph Zager
 * @license MIT
 * @link https://github.com/chzager/menubox
 *
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
	 * @type {Map<string, Menubox2>}
	 */
	static instances = new Map();

	/**
	 * Closes all menuboxes.
	 */
	static closeAll ()
	{
		for (const menubox of Menubox2.instances.values())
		{
			menubox.close();
		}
	};

	/**
	 * Default creator for a menu item's representation HTML element.
	 * @type {Menubox2ItemRenderFunction}
	*/
	static itemRenderer (itemProps)
	{
		const result = document.createElement("div");
		result.classList.add((!!itemProps.key) ? "menubox-item" : "menubox-label");
		if (Array.isArray(itemProps.cssClasses))
		{
			result.classList.add(...itemProps.cssClasses);
		}
		result.textContent = itemProps.label ?? itemProps.key ?? null;
		return result;
	}

	/**
	 * Default event handler for clicks on menu items. This triggers only for enabled items that have a `key` value.
	 *
	 * Depending on the menuboxes `selectMode` this fires the callback or closes the menubox.
	 *
	 * For menuboxes with any kind of multiselect, this toggles the "checked" state of the clicked menu item.
	 *
	 * @param {PointerEvent} event Event that has been triggered by clicking on the menu item.
	 * @param {Menubox2} menubox Menubox that has send this event.
	 */
	static onMenuItemClick (event, menubox)
	{
		/** @type {Menubox2Item} */
		const menuItem = menubox.items.find(i => (i.key === event.target.closest(".menubox-item")?.dataset?.key));
		if (menuItem?.enabled)
		{
			if (menuItem.submenu instanceof Menubox2)
			{
				menuItem.submenu.popup(event, menubox.context, menuItem.element);
				menuItem.element.classList.add("active");
			}
			else
			{
				if (menubox.isMultiselect)
				{
					menuItem.checked = !menuItem.checked;
				}
				if ([Menubox2.SELECT_MODE.normal, Menubox2.SELECT_MODE.multiselect_interactive].includes(menubox.selectMode))
				{
					menubox.callback?.(menuItem);
					if (menubox.selectMode === Menubox2.SELECT_MODE.normal)
					{
						menubox.close();
					}
				}
			}
		}
	};

	/**
	 * This menuboxes menu items.
	 * @type {Array<Menubox2Item<ContextType>>}
	 */
	#items;

	/**
	 * Current context of the menubox. This is set on {@link popup()} or {@link toggle()}.
	 * @type {ContextType}
	 */
	context;

	/**
	 * @param {string} id Id of this menubox.
	 * @param {Menubox2Definition} options Definition of how this menubox is to be created.
	 * @param {Menubox2} [_parentMenubox] Parent menubox if this is a submenu. For internal use only!
	 */
	constructor(id, options, _parentMenubox = undefined)
	{
		if (Menubox2.instances.has(id))
		{
			console.debug(`Menubox "${id}" already existed, has been replaced.`);
			document.body.querySelector(`[data-menubox="${id}"]`)?.remove();
		}
		/** Unique identifier of the menubox. */
		this.id = id;
		/** The parent manubox if this is an submenu. */
		this.parentMenubox = _parentMenubox;
		/** Mode of how menubox items can be selected. */
		this.selectMode = options.selectMode ?? Menubox2.SELECT_MODE.normal;
		/** Callback function for clicks on menu items. */
		this.callback = options.callback;
		/** Renderer to create the HTML elements that represent a single menu item. */
		this.itemRenderer = (typeof options.itemRenderer === "function") ? options.itemRenderer : Menubox2.itemRenderer;
		/** Directives how to adjust this menubox to another element on the document. */
		this.adjustment = Object.assign({ horizontal: "left", vertical: "below" }, options.adjustment);
		/** CSS styles to apply on the menubox when opening. The first value is for closed state, the second value is for opened state. Remember to declare matching transitions in the CSS class of the menubox. */
		this.transitions = Object.assign({ visibility: ["hidden", "visible"] }, options.transitions);
		/** Delay in milliseconds before a submenu is opened after it's parent menuitem was hovered. Default is `300`ms. */
		this.submenuDelay = Math.max(options.submenuDelay || 300, 0);
		/** HTML element that represents this menubox on the document. */
		this.element = this.#newElement("div.menubox", // wrapper DIV is required for transitions
			{
				"data-menubox": id,
				"style": `position: ${options.position ?? "absolute"}; top:0px;left:0px`,
				onclick: (evt) => Menubox2.onMenuItemClick(evt, this),
				onmouseleave: () => clearTimeout(Menubox2.currentSubmenuTimerId),
			},
			this.#newElement("div.menubox-wrapper",
				this.#newElement("div.menubox-items")
			)
		);
		this.element.classList.toggle("menubox-multiselect", this.isMultiselect);
		if (typeof options.css === "string")
		{
			this.element.classList.add(...options.css.split(" "));
		}
		document.body.appendChild(this.element); // This MUST happen before the items are created in order to have submenus atop their parents.
		this.items = options.items;
		Menubox2.instances.set(this.id, this);
		Menubox2.closeAll();
	};

	/**
	 * Sets the visibility of the menubox.
	 *
	 * This method respects opening and closing animations via transitions.
	 * @param {boolean} visible Whether the menubox is to be visible or to be hidden.
	 * @private
	 */
	#setVisibility (visible)
	{
		for (const [property, values] of Object.entries(this.transitions))
		{
			let styleValue = values[(visible) ? 1 : 0];
			if (styleValue === "auto")
			{
				const rect = this.element.firstElementChild.getBoundingClientRect();
				const style = window.getComputedStyle(this.element);
				if (property === "height")
				{
					styleValue = rect.height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.marginTop) + parseFloat(style.marginBottom) + "px";
				}
				else if (property === "width")
				{
					styleValue = rect.width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.marginLeft) + parseFloat(style.marginRight) + "px";
				}
				else
				{
					console.warn(`"auto" not supported for ${property}`);
				}
			}
			this.element.style[property] = styleValue;
		}
	};

	/**
	 * Items in this menubox.
	 * @returns {Aray<Menubox2Item<ContextType>>}
	 */
	get items ()
	{
		return this.#items;
	}
	/** @param {Array<Menubox2ItemDefinition>} itemDefs  */
	set items (itemDefs)
	{
		this.#items = [];
		/** @type {Array<HTMLElement>} */
		const itemElements = [];
		for (const itemDef of itemDefs)
		{
			if (itemDef.separator)
			{
				itemElements.push(this.#newElement("hr.menubox-separator"));
			}
			else
			{
				const menuItem = new Menubox2Item(itemDef, this);
				itemElements.push(menuItem.element);
				if (itemDef.key)
				{
					this.#items.push(menuItem);
				}
			}
		}
		this.element.querySelector("div.menubox-items").replaceChildren(...itemElements);
	}

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
	 * @param {PointerEvent} [pointerEvent] Triggering event. If this is triggered by a pointer event, this **must** be passed here, otherwise the menubox is closed immediately after opening.
	 * @param {ContextType} [context] Context in which the menubox was opened.
	 * @param {HTMLElement} [anchorElement] Element in document to which align the menubox. If omitted, the menubox is aligned to the pointer position.
	 */
	popup (pointerEvent, context = undefined, anchorElement = undefined)
	{
		const adjustToAnchor = (/** @type {HTMLElement} */anchorElement) =>
		{
			// TODO: Adjust center/middle
			const menuboxRect = this.element.firstElementChild.getBoundingClientRect();
			const anchorRect = anchorElement.getBoundingClientRect();
			const position = { x: 0, y: 0 };
			switch (this.adjustment.horizontal)
			{
				case "before":
					position.x = anchorRect.left - menuboxRect.width;
					break;
				case "right":
					position.x = anchorRect.right - menuboxRect.width;
					break;
				case "after":
					position.x = anchorRect.right;
					break;
				case "left":
				default:
					position.x = anchorRect.left;
					break;
			}
			switch (this.adjustment.vertical)
			{
				case "submenu-top":
					const menuboxStyle = window.getComputedStyle(this.element);
					position.y = anchorRect.top - Number.parseFloat(menuboxStyle.paddingTop) - Number.parseFloat(menuboxStyle.borderTopWidth);
					break;
				case "above":
					position.y = anchorRect.top - menuboxRect.height;
					break;
				case "top":
					position.y = anchorRect.top;
					break;
				case "bottom":
					position.y = anchorRect.bottom - menuboxRect.height;
					break;
				case "below":
				default:
					position.y = anchorRect.bottom;
					break;
			}
			/* rescpect scroll position for non-fixed elements */
			if (window.getComputedStyle(this.element).position !== "fixed")
			{
				position.y += window.scrollY;
				position.x += window.scrollX;
			}
			/* set position */
			this.element.style.top = Math.round(position.y) + "px";
			this.element.style.left = Math.round(position.x) + "px";
		};
		if (!this.parentMenubox)
		{
			Menubox2.closeAll();
		}
		pointerEvent?.stopPropagation();
		const itemsElement = this.element.querySelector("div.menubox-items");
		const scrollPos = (this.element.style.position === "fixed") ? { top: 0, left: 0 } : { top: document.documentElement.scrollTop, left: document.documentElement.scrollLeft };
		itemsElement.scrollTo({ top: 0 });
		itemsElement.style.height = null;
		itemsElement.style.overflowY = null;
		this.context = context;
		this.#setVisibility(true);
		if (anchorElement instanceof HTMLElement)
		{
			adjustToAnchor(anchorElement);
		}
		else
		{
			this.element.style.top = pointerEvent.clientY + scrollPos.top + "px";
			this.element.style.left = pointerEvent.clientX + scrollPos.left + "px";
		}
		/* prevent menubox exceeds viewport */
		const elementRect = this.element.getBoundingClientRect();
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
	};

	/**
	 * Closes the menubox.
	 * @param {boolean} [closeSubmenus] If `true` all submenus of this box will be closed. Default `false`.
	 */
	close (closeSubmenus)
	{
		this.#setVisibility(false);
		for (const activeSubmenus of /** @type {NodeListOf<HTMLElement>} */(this.element.querySelectorAll(".menubox-item.active")))
		{
			activeSubmenus.classList.remove("active");
		}
		(closeSubmenus === true) ? this.closeSubmenus() : this.parentMenubox?.close();
	};

	/**
	 * Pops up the menubox if it is not yet opened. Closes the menubox if it is already opened.
	 * @param {PointerEvent} [pointerEvent] Triggering event. If this is triggered by a pointer event, this **must** be passed here, otherwise the menubox is closed immediately after opening.
	 * @param {ContextType} [context] Context in which the menubox was opened.
	 * @param {HTMLElement} [anchorElement] Element in document to which align the menubox. If omitted, the menubox is aligned to the pointer position.
	 * @returns {boolean} `true` if the menubox is being shon now, `false` if it was closed.
	 */
	toggle (pointerEvent, context = null, anchorElement = null)
	{
		pointerEvent.stopPropagation();
		const result = (this.element.style.visibility !== "visible");
		if (result === true)
		{
			this.popup(pointerEvent, context, anchorElement);
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
		for (const menuItem of this.items)
		{
			if (menuItem.submenu instanceof Menubox2)
			{
				menuItem.submenu.closeSubmenus();
				menuItem.submenu.close(true);
				menuItem.element.classList.remove("active");
			}
		}
	}

	/**
	 * Returns an array with all items of this menubox that have the _checked_ status.
	 * @returns {Array<Menubox2Item>} Returns all items of this menubox that have the _checked_ status.
	 */
	getCheckedItems ()
	{
		const result = [];
		for (const menuItem of this.items)
		{
			if (menuItem.checked)
			{
				result.push(menuItem);
			}
		}
		return result;
	}

	/**
	 * Creates a new HTML element.
	 * @param {string} definition The tag of the desired HTML element and optionally an Id and css classes, in a _query selector_ like notation (i.e. `"div#id.class1.class2"`).
	 * @param  {...string | number | HTMLElement | {[key: string]: string | number | boolean | Function} } [content] Content (or children) to be created on/in the HTML element. This may be text content, child HTML elements or a record of attributes or event handlers.
	 * @returns {HTMLElement} Returns the newly created HTML element with all it's content and children.
	 */
	#newElement (definition, ...content)
	{
		const [_m, tagName, _g2, id] = /^([a-z0-9]+)(#([^.\s\[]+))?/.exec(definition);
		const element = document.createElement(tagName);
		(!!id) && (element.id = id);
		const dotPos = definition.indexOf(".") + 1;
		if (dotPos)
		{
			element.classList.add(...definition.substring(dotPos).split("."));
		}
		for (let item of content)
		{
			if ((item !== null) && (item !== undefined))
			{
				switch (typeof item)
				{
					case "bigint":
					case "boolean":
					case "number":
						element.appendChild(document.createTextNode(item.toString()));
						break;
					case "string":
						for (const [match, unicodeChar] of item.matchAll(/&#x([0-9a-f]+);/ig))
						{
							item = item.replace(match, JSON.parse("\"\\u" + unicodeChar + "\""));
						}
						element.appendChild(document.createTextNode(item));
						break;
					case "object":
						if (item instanceof HTMLElement)
						{
							element.appendChild(item);
						}
						else if (!Array.isArray(item))
						{
							for (const [key, value] of Object.entries(item))
							{
								if (typeof value === "function")
								{
									element[key] = value;
								}
								else
								{
									element.setAttribute(key, value);
								}
							}
						}
						else
						{
							throw new TypeError(`Expected String, Number, Object or HTMLElement, got ${item.constructor.name ?? typeof item}`);
						}
						break;
				}
			}
		}
		return element;
	};
};

/**
 * An item of a menubox.
 * @template ContextType
 */
class Menubox2Item
{
	/**
	 * @param {Menubox2ItemDefinition} properties Properties of the menu item.
	 * @param {Menubox2<ContextType>} parent Menubox that owns this menu item. If omitted, the default constructor function of `Menubox2Item` is used.
	 */
	constructor(properties, parent)
	{
		/** Menubox that owns this menu item. */
		this.menubox = parent;
		/** This menu item's key. */
		this.key = properties.key;
		/** HTML element that represents this menu item. */
		this.element = parent.itemRenderer(properties);
		if ((typeof properties.key === "string") && (properties.key !== ""))
		{
			this.element.dataset.key = properties.key;
			if (properties.submenu instanceof Object)
			{
				const submenuId = parent.id + "." + this.key;
				const submenuDef = Object.assign({}, properties.submenu, {
					adjustment: {
						horizontal: "after",
						vertical: "submenu-top" // "submenu-top" is reserved for submenus and is therefore not documented.
					},
					transitions: properties.submenu.transitions ?? parent.transitions,
					css: "submenubox",
					callback: parent.callback
				});
				/** A submenu that opens on that menuitem. Menuitems with submenus do not trigger the callback nor do they close the menubox when clicked. @type {Menubox2<ContextType>} */
				this.submenu = new Menubox2(submenuId, submenuDef, parent);
				this.element.classList.add("submenuitem");
			}
			else if (typeof properties.callback === "function")
			{
				this.element.addEventListener("click", (evt) =>
				{
					evt.stopPropagation();
					if (this.enabled)
					{
						properties.callback(this);
						this.menubox.close();
					}
				});
			}
		}
		this.element.addEventListener("mouseenter", (evt) =>
		{
			this.menubox.closeSubmenus();
			if (this.submenu instanceof Menubox2)
			{
				/** Undocumented internal field for submenu popup-on-hover delays. */
				Menubox2.currentSubmenuTimerId = setTimeout(
					() =>
					{
						this.submenu.popup(evt, this.menubox.context, this.element);
						this.element.classList.add("active");
					},
					parent.submenuDelay);
			}
		});
		this.element.classList.toggle("multiselect", parent.isMultiselect);
		this.element.classList.toggle("checked", (properties.checked === true));
		this.element.classList.toggle("disabled", (properties.enabled === false));
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
			this.element.classList.toggle("checked", val);
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
		return !(this.element.classList.contains("disabled"));
	}
	set enabled (val)
	{
		if (typeof val === "boolean")
		{
			this.element.classList.toggle("disabled", !val);
		}
		else
		{
			throw new TypeError("Boolean value expected.");
		}
	}

	/**
	 * The label of the menu item. This is the text that is being displayed in the document.
	 */
	get label ()
	{
		return this.element.textContent;
	}
}

//#region Event listeners on clicks and keydows on the document to close menuboxes.
window.addEventListener("click", (pointerEvent) =>
{
	if (pointerEvent.target.closest("[data-menubox]") === null)
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
