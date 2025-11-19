// Preline UI initialization - only on client side
import { browser } from "$app/environment";

if (browser) {
	import("preline/dist");
}
