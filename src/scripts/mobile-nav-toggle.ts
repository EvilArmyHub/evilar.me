class MobileNavToggle extends HTMLElement {
	#menuOpen = false;
	#button: HTMLButtonElement | null = null;
	#headerEl: HTMLElement | null = null;
	#navLinkEls: HTMLAnchorElement[] = [];

	connectedCallback() {
		this.#headerEl = this.closest<HTMLElement>("[data-header-root]");
		this.#button = this.querySelector<HTMLButtonElement>("button");

		if (!this.#headerEl || !this.#button) {
			return;
		}

		this.#navLinkEls = this.#getNavLinks();
		this.#menuOpen = this.#headerEl.classList.contains("menu-open");
		this.#button.setAttribute("aria-expanded", String(this.#menuOpen));
		this.#button.addEventListener("click", this.#toggleMenu);
		this.#navLinkEls.forEach((link) => {
			link.addEventListener("click", this.#closeMenu);
		});
	}

	disconnectedCallback() {
		this.#button?.removeEventListener("click", this.#toggleMenu);
		this.#navLinkEls.forEach((link) => {
			link.removeEventListener("click", this.#closeMenu);
		});
		this.#navLinkEls = [];
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
}

if (!customElements.get("mobile-nav-toggle")) {
	customElements.define("mobile-nav-toggle", MobileNavToggle);
}
