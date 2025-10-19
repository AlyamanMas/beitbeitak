import { supabase } from '$lib/supabaseClient.js';

/**
 * Authentication store using Svelte 5 runes
 * Manages user authentication state and provides auth methods
 */

let user = $state(null);
let session = $state(null);
let loading = $state(true);
let profileData = $state(null);

/**
 * Initialize auth state listener
 */
export function initAuth() {
	// Get initial session
	supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
		session = initialSession;
		user = initialSession?.user ?? null;
		if (user) {
			loadProfileData();
		}
		loading = false;
	});

	// Listen for auth changes
	const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
		session = newSession;
		user = newSession?.user ?? null;
		if (user) {
			await loadProfileData();
		} else {
			profileData = null;
		}
		loading = false;
	});

	return authListener;
}

/**
 * Load user profile data from public.users table
 */
async function loadProfileData() {
	if (!user) return;

	const { data, error } = await supabase
		.from('users')
		.select('first_name, last_name, profile_pic')
		.eq('id', user.id)
		.single();

	if (!error && data) {
		profileData = data;
	}
}

/**
 * Refresh user profile data
 * Call this after updating profile information
 */
export async function refreshProfileData() {
	await loadProfileData();
}

/**
 * Sign up a new user with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Promise<{user: any, error: any}>}
 */
export async function signUp(email, password, firstName, lastName) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password
	});

	if (error) {
		return { user: null, error };
	}

	// Insert user data into public.users table
	if (data.user) {
		const { error: insertError } = await supabase.from('users').insert({
			id: data.user.id,
			first_name: firstName,
			last_name: lastName
		});

		if (insertError) {
			return { user: data.user, error: insertError };
		}
	}

	return { user: data.user, error: null };
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: any, error: any}>}
 */
export async function signIn(email, password) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	return { user: data?.user ?? null, error };
}

/**
 * Sign out the current user
 * @returns {Promise<{error: any}>}
 */
export async function signOut() {
	const { error } = await supabase.auth.signOut();
	return { error };
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<{error: any}>}
 */
export async function resetPassword(email) {
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/auth/reset-password`
	});
	return { error };
}

/**
 * Get the current user
 * @returns {any}
 */
export function getUser() {
	return user;
}

/**
 * Get the current session
 * @returns {any}
 */
export function getSession() {
	return session;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
	return !!user;
}

/**
 * Check if auth is loading
 * @returns {boolean}
 */
export function isLoading() {
	return loading;
}

/**
 * Get user profile data
 * @returns {any}
 */
export function getProfileData() {
	return profileData;
}

/**
 * Get profile picture URL
 * @returns {string | null}
 */
export function getProfilePicUrl() {
	if (!profileData?.profile_pic) return null;

	// Get the public URL using the profile_pic path
	const { data } = supabase.storage.from('profile_pics').getPublicUrl(profileData.profile_pic);
	return data?.publicUrl ?? null;
}
