/**
 * A pop-up menubox.
 * @version 1.0.0
 * @copyright (c) 2024 Christoph Zager
 * @license MIT
 * @link https://github.com/chzager/menubox
 */
interface Menubox2<ContextType> {
	/** This menuboxes HTML element on the document. */
	element: HTMLElement;

	/** This menuboxes menu items. */
	items: Map<string, Menubox2Item<ContextType>>;

	/** Renderer to create the HTML elements that represents a single menu item on the menu box. */
	itemRenderer: Menubox2ItemRenderer;

	/** Directives how to adjust this menubox to another element on the document. */
	adjustment: Menubox2Adjustment;

	/** Delay in milliseconds before a submenu is opened after it's parent menuitem was hovered. Default is `300`ms. */
	submenuDelay: number;

	/** Current context of the menubox. This is set on {@linkcode popup()} or {@linkcode toggle()}. */
	context: ContextType;

	/** Callback function for clicks on menu items. */
	callback: Menubox2Callback;

	/** Gives the very ancestor of a menubox, especially of a sub-menubox. */
	get rootMenubox(): Menubox2<ContextType>;

	/**
	 * `true` if the menubox allows selecting multiple items in any way, otherwise `false`.
	 *
	 * Multiselect can be set in the options when creating a menubox to
	 * - `"multiselect"`: Allows selection of multiple items, but does not trigger the callback.
	 * - `"multiselect_interactive"`: Allows selection of multiple items. Every selection does trigger the callback.
	 *
	 * Multiselect-menuboxes do not close on clicking their items.
	 */
	get isMultiselect(): boolean;

	/**
	 * Pops up the menubox.
	 * @param mouseEvent Triggering event. If this is triggered by a pointer event, this **must** be passed here, otherwise the menubox is closed immediately after opening.
	 * @param context Context in which the menubox was opened.
	 * @param anchorElement Element in document to which align the menubox. If omitted, the menubox is aligned to the pointer position.
	 */
	popup(mouseEvent: PointerEvent, context?: ContextType, anchorElement?: HTMLElement): void;

	/**
	 * Closes the menubox.
	 * @param closeSubmenus If `true` all submenus of this box will be closed. Default `false`.
	 */
	close(closeSubmenus: boolean): void;

	/**
	 * Pops up the menubox if it is not yet opened. Closes the menubox if it is already opened.
	 * @param mouseEvent Triggering event. If this is triggered by a pointer event, this **must** be passed here, otherwise the menubox is closed immediately after opening.
	 * @param context Context in which the menubox was opened.
	 * @param anchorElement Element in document to which align the menubox. If omitted, the menubox is aligned to the pointer position.
	 * @returns {boolean} `true` if the menubox is being shon now, `false` if it was closed.
	 */
	toggle(mouseEvent: PointerEvent, context?: ContextType, anchorElement?: HTMLElement): boolean;

	/** Closes all submenus of this menubox. This menubox remain open. */
	closeSubmenus(): void;

	/**
	 * Returns an array with all items of this menubox that have the _checked_ status.
	 * @returns {Array<Menubox2Item>} Returns all items of this menubox that have the _checked_ status.
	 */
	getCheckedItems(): Menubox2Item<ContextType>[];
}
declare var Menubox2: {
	SELECT_MODE: {
		/** When an item is clicked, callback is called and the menubox closes. (default) */
		normal: "normal";
		/** When an item is clicked, callback is called but the menubox remains opened, you need to close it manually. */
		persistent: "persistent";
		/** When an item is clicked, it's "checked" state toggels. The menubox remains opened until closed manually. */
		multiselect: "multiselect";
		/** Like "multiselect", but every item click calls the callback so you can react on it. */
		multiselect_interactive: "multiselect_interactive";
	};

	/** Map of all menubox instances. */
	instances: Map<string, Menubox2<any>>;

	/** Closes all menuboxes. */
	closeAll(): void;

	/**
	 * @param id Id of this menubox.
	 * @param options Definition of how this menubox is to be created.
	 */
	new <ContextType>(id: string, options: Menubox2Definition): Menubox2<ContextType>;
};

/** Definition of a menubox to be created. */
interface Menubox2Definition {
	/** Additional CSS classes. Single string, multiple entries separated by space. */
	css?: string;

	/**
	 * Positioning of the menubox on the viewport.
	 * - `"absolute"`: The menubox remains an the document position while scrolling. (Default)
	 * - `"fixed"`: The menubox stays at the viewport position even if the document scrolls.
	 */
	position?: "absolute" | "fixed";

	/** Directives for adjusting the menubox to another element. */
	adjustment?: Menubox2Adjustment;

	/** CSS styles for animations on opening/closing the menubox. */
	transistions?: Menubox2Transistion;

	/**
	 * Mode of how menubox items can be selected.
	 * - `"normal"`: When an item is clicked, callback is called and the menubox closes. (default)
	 * - `"persistent"`:  When an item is clicked, callback is called but the menubox remains opened, you need to close it manually.
	 * - `"multiselect"`: When an item is clicked, it's "checked" state toggels. The menubox remains opened until closed manually.
	 * - `"multiselect_interactive"`: Like "multiselect", but every item click calls the callback so you can react on it.
	 */
	selectMode?: keyof typeof Menubox2.SELECT_MODE;

	/** Callback function when a menubox item is clicked. */
	callback?: Menubox2Callback;

	/** List of items in the menubox. */
	items?: Array<Menubox2ItemProperties | Menubox2Separator>;

	/** Function to create HTML elements for menubox items. */
	itemRenderer?: Menubox2ItemRenderer;

	/** Delay in milliseconds before a submenu opens after hovering. */
	submenuDelay?: number;
}

/** Directives for adjusting a menubox to another element on the document. */
interface Menubox2Adjustment {
	/** Horizontal adjustment. Default is "right". */
	horizontal?: "before" | "left" | "right" | "after";

	/** Vertical adjustment. Default is "below". */
	vertical?: "above" | "top" | "bottom" | "below";
}

/** CSS styles for animations on opening/closing the menubox. */
type Menubox2Transistion = any; //{ [key: string]: [string, string] };

/** Callback function when a menubox item is clicked. */
interface Menubox2Callback {
	/**
	 * @param item The menubox item that has been clicked.
	 */
	<ContextType>(item: Menubox2Item<ContextType>): void;
}

/** Definition of a menubox item for creation. */
interface Menubox2ItemProperties {
	/** Key of the item. Only items with a key trigger callbacks on clicks. */
	key?: string;

	/** Label of the item to be displayed on the menubox. */
	label?: string;

	/** Individual callback function for this menu item. */
	callback?: Menubox2Callback;

	/** Whether the item has the `checked` state. Default is `false`. */
	checked?: boolean;

	/** Whether the item is enabled for clicks. Default is `true`. */
	enabled?: boolean;

	/** Additional classes for the menu item. */
	cssClasses?: string[];

	/**
	 * A submenu that expands when this menu item is hovered.
	 *
	 * The ID of the submenu is auto-generated of the parent menubox ID and the key of the menuitem.
	 * So menuitems with submenus are required to have a key.
	 */
	submenu?: Menubox2Definition;
}

/** A separator between menubox items. */
interface Menubox2Separator {
	separator: any;
}

/** Function that constructs an HTML element representing a menu item. */
interface Menubox2ItemRenderFunction {
	/**
	 * @param itemProps Properties of the menu item to get it's representing HTML element constructed.
	 */
	(itemProps: Menubox2ItemProperties): HTMLElement;
}

/** An item of a menubox. */
interface Menubox2Item<ContextType> {
	/** This menu item's key. */
	key?: string;

	/** Menubox that owns this menu item. */
	menubox: Menubox2<ContextType>;

	/** HTML element that represents this menu item. */
	element: HTMLElement;

	/**
	 * A submenu that opens on that menuitem.
	 *
	 * Menuitems with submenus do not trigger the callback nor do they close the
	 * menubox when clicked.
	 */
	submenu: Menubox2<ContextType>;

	/** Tells whether the item has the "checked" state or not. */
	checked: boolean;

	/**
	 * Tells whether the item is enabled or not. Disabled items do not trigger the callback when they are clicked.
	 * Only enabled items with a key trigger callbacks on clicks.
	 */
	enabled: boolean;

	/** The menu items label. This is the text that is being displayed in the document. */
	get label(): string;
}
declare var Menubox2Item: {
	/**
	 * @param properties Properties of the menu item.
	 * @param parent Menubox that owns this menu item.
	 *  If omitted, the default constructor function of `Menubox2Item` is used.
	 */
	new <ContextType>(properties: any, parent: Menubox2<ContextType>): Menubox2Item<ContextType>;
	readonly prototype: Menubox2Item<any>;
};

/** Base interface for creating HTML elements that act as a menubox item on the UI. */
interface Menubox2ItemRenderer {
	/** For a menu item, this constructs its representing HTML element. */
	create: Menubox2ItemRenderFunction;
}
