import { getVercelLegacyRedirects } from "./src/utils/content-routes";

export const config = {
	redirects: getVercelLegacyRedirects(),
};
