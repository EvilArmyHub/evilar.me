class MobileNavToggle extends HTMLElement {
	#menuOpen = false;
	#button: HTMLButtonElement | null = null;
	#headerEl: HTMLElement | null = null;
	#navEl: HTMLElement | null = null;
	#navLinkEls: HTMLAnchorElement[] = [];

	connectedCallback() {
		this.#headerEl = this.closest<HTMLElement>("[data-header-root]");
		this.#button = this.querySelector<HTMLButtonElement>("button");

		if (!this.#headerEl || !this.#button) {
			return;
		}

		this.#navLinkEls = this.#getNavLinks();
		this.#navEl = this.#getNavEl();
		this.#menuOpen = this.#headerEl.classList.contains("menu-open");
		this.#button.setAttribute("aria-expanded", String(this.#menuOpen));
		this.#button.addEventListener("click", this.#toggleMenu);
		this.#navLinkEls.forEach((link) => {
			link.addEventListener("click", this.#closeMenu);
		});
		document.addEventListener("click", this.#onDocumentClick);
		document.addEventListener("keydown", this.#onKeyDown);
	}

	disconnectedCallback() {
		this.#button?.removeEventListener("click", this.#toggleMenu);
		this.#navLinkEls.forEach((link) => {
			link.removeEventListener("click", this.#closeMenu);
		});
		this.#navLinkEls = [];
		document.removeEventListener("click", this.#onDocumentClick);
		document.removeEventListener("keydown", this.#onKeyDown);
	}

	#getNavEl(): HTMLElement | null {
		const navId = this.#button?.getAttribute("aria-controls");
		if (navId) {
			return this.#headerEl?.querySelector<HTMLElement>(`#${CSS.escape(navId)}`) ?? null;
		}
		return this.#headerEl?.querySelector<HTMLElement>("[data-header-nav]") ?? null;
	}

	#getNavLinks() {
		const navId = this.#button?.getAttribute("aria-controls");
		const navEl = navId
			? this.#headerEl?.querySelector<HTMLElement>(`#${CSS.escape(navId)}`)
			: this.#headerEl?.querySelector<HTMLElement>("[data-header-nav]");

		return Array.from(navEl?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
	}

	#toggleMenu = () => {
		if (!this.#headerEl) {
			return;
		}

		this.#menuOpen = !this.#menuOpen;
		this.#headerEl.classList.toggle("menu-open", this.#menuOpen);
		this.#button?.setAttribute("aria-expanded", String(this.#menuOpen));
	};

	#closeMenu = () => {
		if (!this.#headerEl || !this.#menuOpen) {
			return;
		}

		this.#menuOpen = false;
		this.#headerEl.classList.remove("menu-open");
		this.#button?.setAttribute("aria-expanded", "false");
	};

	/** Close the dropdown when clicking anywhere outside the toggle button or nav */
	#onDocumentClick = (e: MouseEvent) => {
		if (!this.#menuOpen) return;
		const target = e.target as Node;
		if (this.#button?.contains(target) || this.#navEl?.contains(target)) return;
		this.#closeMenu();
	};

	/** Close on Escape key */
	#onKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") this.#closeMenu();
	};
}

if (!customElements.get("mobile-nav-toggle")) {
	customElements.define("mobile-nav-toggle", MobileNavToggle);
}
