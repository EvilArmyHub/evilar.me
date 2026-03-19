import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { h, isNodeDirective } from "../utils/remark";

const DIRECTIVE_NAME = "github";

type GithubCardTarget =
	| {
			kind: "repo";
			owner: string;
			repo: string;
			label: string;
			path: string;
			url: string;
			apiUrl: string;
	  }
	| {
			kind: "user";
			owner: string;
			label: string;
			path: string;
			url: string;
			apiUrl: string;
	  };

const GITHUB_HOSTNAMES = new Set(["github.com", "www.github.com"]);
const SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

function stripSlashes(value: string): string {
	return value.replace(/^\/+|\/+$/g, "");
}

function normalizeGithubTarget(value: unknown): GithubCardTarget | null {
	if (typeof value !== "string") return null;

	let normalized = value.trim();
	if (!normalized) return null;

	try {
		if (/^[a-z][a-z\d+.-]*:\/\//iu.test(normalized)) {
			const url = new URL(normalized);
			if (!GITHUB_HOSTNAMES.has(url.hostname.toLowerCase())) return null;
			normalized = url.pathname;
		}
	} catch {
		return null;
	}

	normalized = normalized.replace(/^github\.com\//iu, "");
	normalized = stripSlashes(normalized.split(/[?#]/u, 1)[0] ?? "");
	if (!normalized) return null;

	const parts = normalized.split("/").filter(Boolean);
	if (parts.length === 0 || parts.length > 2) return null;
	if (parts.some((part) => !SEGMENT_PATTERN.test(part))) return null;

	const owner = parts[0];
	if (!owner) return null;

	if (parts.length === 1) {
		return {
			kind: "user",
			owner,
			label: owner,
			path: owner,
			url: `https://github.com/${owner}`,
			apiUrl: `https://api.github.com/users/${owner}`,
		};
	}

	const repo = parts[1];
	if (!repo) return null;

	const path = `${owner}/${repo}`;

	return {
		kind: "repo",
		owner,
		repo,
		label: path,
		path,
		url: `https://github.com/${path}`,
		apiUrl: `https://api.github.com/repos/${path}`,
	};
}

function createCardId(): string {
	const uuid =
		globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	return `GC-${uuid}`;
}

function text(value: string) {
	return { type: "text" as const, value };
}

function createCardScript(target: GithubCardTarget): ReturnType<typeof h> {
	const endpoint = JSON.stringify(target.apiUrl);
	const cardLabel = JSON.stringify(target.path);
	const successHandler =
		target.kind === "repo"
			? `
				setText('.gh-description', sanitizeDescription(data.description));
				setText('.gh-language', getString(data.language));
				setText('.gh-license', getString(data.license?.spdx_id));
				setNumber('.gh-forks', data.forks);
				setNumber('.gh-stars', data.stargazers_count);
				setAvatar(getString(data.owner?.avatar_url));
			`
			: `
				setNumber('.gh-followers', data.followers);
				setNumber('.gh-repositories', data.public_repos);
				setText('.gh-region', getString(data.location));
				setAvatar(getString(data.avatar_url));
			`;

	return h("script", {}, [
		text(`
			(async () => {
				const script = document.currentScript;
				const card = script?.closest('.github-card');
				if (!card) return;

				const formatter = new Intl.NumberFormat(undefined, {
					notation: 'compact',
					maximumFractionDigits: 1,
				});
				const select = (selector) => card.querySelector(selector);
				const getString = (value) => typeof value === 'string' ? value.trim() : '';
				const sanitizeDescription = (value) => getString(value).replace(/:[a-zA-Z0-9_+-]+:/g, '');
				const setHidden = (selector, hidden) => {
					const element = select(selector);
					if (element) element.hidden = hidden;
				};
				const setText = (selector, value) => {
					const element = select(selector);
					if (!element) return;
					if (!value) {
						element.hidden = true;
						element.textContent = '';
						return;
					}
					element.hidden = false;
					element.textContent = value;
				};
				const setNumber = (selector, value) => {
					const numeric = typeof value === 'number' && Number.isFinite(value) ? value : null;
					setText(
						selector,
						numeric === null ? '' : formatter.format(numeric).replaceAll('\u202f', ''),
					);
				};
				const setAvatar = (url) => {
					const avatar = select('.gh-avatar');
					if (!(avatar instanceof HTMLElement)) return;
					avatar.style.backgroundImage = url ? 'url("' + encodeURI(url) + '")' : '';
					avatar.hidden = !url;
				};
				const fail = (error) => {
					card.classList.remove('gh-loading');
					card.classList.add('gh-error');
					card.setAttribute('aria-busy', 'false');
					console.warn('[GITHUB-CARD] Error loading card for ' + ${cardLabel} + '.', error);
				};

				try {
					const response = await fetch(${endpoint}, {
						headers: { Accept: 'application/vnd.github+json' },
						referrerPolicy: 'no-referrer',
					});
					if (!response.ok) {
						throw new Error('GitHub API request failed with status ' + response.status);
					}

					const data = await response.json();
					if (!data || typeof data !== 'object') {
						throw new Error('GitHub API returned an invalid payload');
					}

					${successHandler}
					card.classList.remove('gh-loading');
					card.classList.remove('gh-error');
					card.setAttribute('aria-busy', 'false');
					setHidden('.gh-description', !select('.gh-description')?.textContent);
				} catch (error) {
					fail(error);
				}
			})();
		`),
	]);
}

function createTitle(target: GithubCardTarget): ReturnType<typeof h> {
	return h("div", { class: "gh-title page-title" }, [
		h("span", { class: "gh-avatar", "aria-hidden": "true" }),
		h(
			"a",
			{
				class: "gh-text not-prose text-link",
				href: target.url,
				rel: "noreferrer",
			},
			[text(target.label)],
		),
		h("span", { class: "gh-icon", "aria-hidden": "true" }),
	]);
}

function createRepoCard(target: Extract<GithubCardTarget, { kind: "repo" }>): ReturnType<typeof h> {
	const cardId = createCardId();
	const script = createCardScript(target);

	return h(
		"div",
		{
			id: cardId,
			class: "github-card gh-loading",
			"aria-busy": "true",
			"data-github-card": target.kind,
		},
		[
			createTitle(target),
			h("div", { class: "gh-description" }, [text("Loading repository details...")]),
			h("div", { class: "gh-chips" }, [
				h("span", { class: "gh-stars" }, [text("--")]),
				h("span", { class: "gh-forks" }, [text("--")]),
				h("span", { class: "gh-license" }, [text("--")]),
				h("span", { class: "gh-language" }, [text("")]),
			]),
			script,
		],
	);
}

function createUserCard(target: Extract<GithubCardTarget, { kind: "user" }>): ReturnType<typeof h> {
	const cardId = createCardId();
	const script = createCardScript(target);

	return h(
		"div",
		{
			id: cardId,
			class: "github-card gh-simple gh-loading",
			"aria-busy": "true",
			"data-github-card": target.kind,
		},
		[
			createTitle(target),
			h("div", { class: "gh-chips" }, [
				h("span", { class: "gh-followers" }, [text("--")]),
				h("span", { class: "gh-repositories" }, [text("--")]),
				h("span", { class: "gh-region" }, [text("")]),
			]),
			script,
		],
	);
}

export const remarkGithubCard: Plugin<[], Root> = () => (tree) => {
	visit(tree, (node, index, parent) => {
		if (!parent || index === undefined || !isNodeDirective(node)) return;

		// We only want a leaf directive named DIRECTIVE_NAME
		if (node.type !== "leafDirective" || node.name !== DIRECTIVE_NAME) return;

		const target = normalizeGithubTarget(node.attributes?.repo ?? node.attributes?.user ?? null);
		if (!target) return;

		parent.children.splice(
			index,
			1,
			target.kind === "repo" ? createRepoCard(target) : createUserCard(target),
		);
	});
};
