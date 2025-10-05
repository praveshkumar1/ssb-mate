/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_CSRF_COOKIE_NAME?: string;
	readonly VITE_CSRF_HEADER_NAME?: string;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SUPABASE_BUCKET?: string;
		readonly VITE_UPLOAD_BACKEND_FALLBACK?: string; // 'true' to fallback to backend /users/upload when anon upload is blocked
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
