const SELECTORS = {
	closeButton: "button[data-close-modal]",
	dialog: "dialog",
	dialogFrame: ".dialog-frame",
	openButton: "button[data-open-modal]",
	pagefindInput: "#site-search-ui .pagefind-ui__search-input",
	pagefindRoot: "#site-search-ui",
} as const;

const WARNING = {
	closeButtonMissing: "Кнопка закрытия не найдена",
	dialogMissing: "Диалоговое окно не найдено",
	openButtonMissing: "Кнопка поиска не найдена",
	pagefindInitFailed: "Не удалось инициализировать поиск",
	pagefindRootMissing: "Контейнер поиска не найден",
} as const;

const onIdle =
	window.requestIdleCallback ||
	((callback: IdleRequestCallback) => window.setTimeout(() => callback({} as IdleDeadline), 1));

let pagefindInitPromise: Promise<void> | null = null;
let pagefindInitialized = false;

const getPagefindSearchInput = () =>
	document.querySelector<HTMLInputElement>(SELECTORS.pagefindInput);

const initPagefind = () => {
	if (import.meta.env.DEV || pagefindInitialized) {
		return Promise.resolve();
	}

	if (pagefindInitPromise) {
		return pagefindInitPromise;
	}

	pagefindInitPromise = new Promise((resolve) => {
		onIdle(async () => {
			const pagefindRoot = document.querySelector(SELECTORS.pagefindRoot);

			if (!pagefindRoot) {
				console.warn(WARNING.pagefindRootMissing);
				pagefindInitPromise = null;
				resolve();
				return;
			}

			try {
				const { PagefindUI } = await import("@pagefind/default-ui");
				new PagefindUI({
					baseUrl: import.meta.env.BASE_URL,
					bundlePath: import.meta.env.BASE_URL.replace(/\/$/, "") + "/pagefind/",
					element: SELECTORS.pagefindRoot,
					showImages: false,
					showSubResults: true,
				});
				pagefindInitialized = true;
			} catch (error) {
				console.warn(WARNING.pagefindInitFailed, error);
				pagefindInitPromise = null;
			}

			resolve();
		});
	});

	return pagefindInitPromise;
};

class SiteSearch extends HTMLElement {
	#bound = false;
	#closeBtn: HTMLButtonElement | null = null;
	#dialog: HTMLDialogElement | null = null;
	#dialogFrame: HTMLDivElement | null = null;
	#modalController: AbortController | null = null;
	#openBtn: HTMLButtonElement | null = null;
	#persistentController: AbortController | null = null;

	constructor() {
		super();
	}

	connectedCallback() {
		if (this.#bound) {
			return;
		}

		this.#bound = true;
		this.#persistentController = new AbortController();
		this.#cacheElements();
		this.#bindPersistentEvents();
		initPagefind();
	}

	disconnectedCallback() {
		this.#bound = false;
		this.#removeModalEvents();
		this.#persistentController?.abort();
		this.#persistentController = null;
	}

	openModal = async (event?: MouseEvent) => {
		if (!this.#dialog) {
			console.warn(WARNING.dialogMissing);
			return;
		}

		if (this.#dialog.open) {
			event?.stopPropagation();
			await this.#focusSearchInput();
			return;
		}

		try {
			this.#dialog.showModal();
		} catch {
			return;
		}

		event?.stopPropagation();
		this.#bindModalEvents();
		await this.#focusSearchInput();
	};

	closeModal = () => {
		if (!this.#dialog?.open) {
			return;
		}

		this.#dialog.close();
	};

	onWindowClick = (event: MouseEvent) => {
		if (!this.#dialog?.open) {
			return;
		}

		const target = event.target as Node | null;
		const isLink = !!(event.target && "href" in (event.target as object));

		if (
			isLink ||
			(target && document.body.contains(target) && !this.#dialogFrame?.contains(target))
		) {
			this.closeModal();
		}
	};

	onWindowKeydown = (event: KeyboardEvent) => {
		if (!this.#dialog) {
			console.warn(WARNING.dialogMissing);
			return;
		}

		if ((event.metaKey === true || event.ctrlKey === true) && event.key === "k") {
			this.#dialog.open ? this.closeModal() : this.openModal();
			event.preventDefault();
		}
	};

	#bindModalEvents = () => {
		if (this.#modalController) {
			return;
		}

		this.#modalController = new AbortController();
		window.addEventListener("click", this.onWindowClick, { signal: this.#modalController.signal });
	};

	#bindPersistentEvents = () => {
		const signal = this.#persistentController?.signal;

		if (!signal) {
			return;
		}

		this.#openBtn?.addEventListener("click", this.openModal, { signal });
		this.#closeBtn?.addEventListener("click", this.closeModal, { signal });
		this.#dialog?.addEventListener("close", this.#removeModalEvents, { signal });
		window.addEventListener("keydown", this.onWindowKeydown, { signal });

		if (this.#openBtn) {
			this.#openBtn.disabled = false;
		} else {
			console.warn(WARNING.openButtonMissing);
		}

		if (!this.#closeBtn) {
			console.warn(WARNING.closeButtonMissing);
		}

		if (!this.#dialog) {
			console.warn(WARNING.dialogMissing);
		}
	};

	#cacheElements = () => {
		this.#openBtn = this.querySelector<HTMLButtonElement>(SELECTORS.openButton);
		this.#closeBtn = this.querySelector<HTMLButtonElement>(SELECTORS.closeButton);
		this.#dialog = this.querySelector<HTMLDialogElement>(SELECTORS.dialog);
		this.#dialogFrame = this.querySelector<HTMLDivElement>(SELECTORS.dialogFrame);
	};

	#focusSearchInput = async () => {
		await initPagefind();

		window.requestAnimationFrame(() => {
			getPagefindSearchInput()?.focus();
		});
	};

	#removeModalEvents = () => {
		this.#modalController?.abort();
		this.#modalController = null;
	};
}

if (!customElements.get("site-search")) {
	customElements.define("site-search", SiteSearch);
}
