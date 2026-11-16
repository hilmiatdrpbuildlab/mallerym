<script lang="ts">
	type Name =
		| 'whatsapp'
		| 'phone'
		| 'mail'
		| 'pin'
		| 'instagram'
		| 'facebook'
		| 'linkedin'
		| 'bed'
		| 'bath'
		| 'area'
		| 'land'
		| 'car'
		| 'users'
		| 'layers'
		| 'moon'
		| 'arrow-right'
		| 'arrow-left'
		| 'search'
		| 'menu'
		| 'close'
		| 'check'
		| 'shield'
		| 'filter'
		| 'calendar'
		| 'home'
		| 'key'
		| 'pen'
		| 'chart'
		| 'image'
		| 'file'
		| 'user'
		| 'settings'
		| 'log'
		| 'logout'
		| 'inbox'
		| 'external'
		| 'star'
		| 'map'
		| 'clock'
		| 'trash'
		| 'eye'
		| 'copy'
		| 'upload'
		| 'grip'
		| 'plus';
	let { name, size = 20, label }: { name: Name; size?: number; label?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={label ? undefined : 'true'}
	role={label ? 'img' : undefined}
	aria-label={label}
	focusable="false"
>
	{#if name === 'whatsapp'}
		<path
			fill="currentColor"
			stroke="none"
			d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm.01 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28Z"
		/>
	{:else if name === 'phone'}
		<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
	{:else if name === 'mail'}
		<rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
	{:else if name === 'pin'}
		<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
	{:else if name === 'instagram'}
		<rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle
			cx="17.5"
			cy="6.5"
			r="0.8"
			fill="currentColor"
		/>
	{:else if name === 'facebook'}
		<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5z" />
	{:else if name === 'linkedin'}
		<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 11v6M8 7.5v.01M12 17v-6M16 17v-3.5a2.5 2.5 0 0 0-4-2" />
	{:else if name === 'bed'}
		<path d="M3 18v-9M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="7" cy="11" r="1.6" />
	{:else if name === 'bath'}
		<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2" />
	{:else if name === 'area'}
		<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
	{:else if name === 'land'}
		<path d="M3 20h18M5 20l4-9 3 5 2-3 5 7" /><circle cx="17" cy="6" r="2" />
	{:else if name === 'car'}
		<path d="M5 16h14v-4l-2-5H7l-2 5v4zM5 16v2M19 16v2M5 12h14" /><circle cx="8" cy="14" r=".6" fill="currentColor" /><circle
			cx="16"
			cy="14"
			r=".6"
			fill="currentColor"
		/>
	{:else if name === 'users'}
		<circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M18 20a6 6 0 0 0-2.5-4.9" />
	{:else if name === 'layers'}
		<path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
	{:else if name === 'moon'}
		<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
	{:else if name === 'arrow-right'}
		<path d="M5 12h14M13 6l6 6-6 6" />
	{:else if name === 'arrow-left'}
		<path d="M19 12H5M11 6l-6 6 6 6" />
	{:else if name === 'search'}
		<circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
	{:else if name === 'menu'}
		<path d="M4 7h16M4 12h16M4 17h16" />
	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6 6 18" />
	{:else if name === 'check'}
		<path d="m5 12 4.5 4.5L19 7" />
	{:else if name === 'shield'}
		<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" />
	{:else if name === 'filter'}
		<path d="M4 6h16M7 12h10M10 18h4" />
	{:else if name === 'calendar'}
		<rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
	{:else if name === 'home'}
		<path d="M3 11 12 4l9 7M5 10v10h14V10" /><path d="M10 20v-6h4v6" />
	{:else if name === 'key'}
		<circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M17 6l3 3M15 8l2 2" />
	{:else if name === 'pen'}
		<path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
	{:else if name === 'chart'}
		<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
	{:else if name === 'image'}
		<rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" />
	{:else if name === 'file'}
		<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" /><path d="M14 3v6h6M8 13h8M8 17h5" />
	{:else if name === 'user'}
		<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
	{:else if name === 'settings'}
		<circle cx="12" cy="12" r="3" /><path
			d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
		/>
	{:else if name === 'log'}
		<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
	{:else if name === 'logout'}
		<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4" />
	{:else if name === 'inbox'}
		<path d="M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6l2-8z" />
	{:else if name === 'external'}
		<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
	{:else if name === 'star'}
		<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" />
	{:else if name === 'map'}
		<path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
	{:else if name === 'clock'}
		<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
	{:else if name === 'trash'}
		<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />
	{:else if name === 'eye'}
		<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
	{:else if name === 'copy'}
		<rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
	{:else if name === 'upload'}
		<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
	{:else if name === 'grip'}
		<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3" />
	{:else if name === 'plus'}
		<path d="M12 5v14M5 12h14" />
	{/if}
</svg>
