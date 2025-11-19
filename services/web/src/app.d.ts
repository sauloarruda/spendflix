import type { IStaticMethods } from "preline/dist";

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface Window {
		// Preline UI
		HSStaticMethods: IStaticMethods;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};

