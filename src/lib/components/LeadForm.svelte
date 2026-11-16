<script lang="ts">
	import { enhance } from '$app/forms';
	import Turnstile from './Turnstile.svelte';
	import Icon from './Icon.svelte';
	import type { LeadFormState } from '$lib/server/leads';

	type Variant = 'full' | 'property' | 'owner';
	let {
		form = null,
		action = '?/lead',
		variant = 'full',
		type = 'general',
		propertyId,
		propertyTitle,
		defaultMessage = '',
		submitLabel = 'Enviar consulta',
		dark = false,
		idPrefix = 'lf'
	}: {
		form?: LeadFormState | null;
		action?: string;
		variant?: Variant;
		type?: string;
		propertyId?: string;
		propertyTitle?: string;
		defaultMessage?: string;
		submitLabel?: string;
		dark?: boolean;
		idPrefix?: string;
	} = $props();

	let submitting = $state(false);
	let sent = $state(false);
	let resetKey = $state(0);
	let startedAt = $state(0);
	$effect(() => {
		startedAt = Date.now();
	});
	const v = $derived(form?.values ?? {});
	const err = $derived(form?.errors ?? {});
	const id = (n: string) => `${idPrefix}-${n}`;
	const message = $derived(
		v.message ?? (defaultMessage || (propertyTitle ? `Hola, me interesa la propiedad "${propertyTitle}". ¿Podrían enviarme más información?` : ''))
	);
</script>

{#if sent || form?.ok}
	<div class="done" class:dark role="status">
		<span class="icon"><Icon name="check" size={28} /></span>
		<h3>¡Gracias! Recibimos tu mensaje.</h3>
		<p>Te contactaremos dentro de las próximas 24 horas hábiles por el medio que elegiste.</p>
	</div>
{:else}
	<form
		method="POST"
		{action}
		class="lead"
		class:dark
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				submitting = false;
				if (result.type === 'success') sent = true;
				else resetKey++;
				await update({ reset: false, refreshAll: false });
			};
		}}
	>
		<input type="hidden" name="type" value={type} />
		{#if propertyId}<input type="hidden" name="propertyId" value={propertyId} />{/if}
		<input type="hidden" name="_t" value={startedAt} />
		<div class="hp" aria-hidden="true">
			<label for={id('website')}>No completar</label>
			<input id={id('website')} name="website" type="text" tabindex="-1" autocomplete="off" />
		</div>

		{#if form?.error}<p class="alert alert--error" role="alert">{form.error}</p>{/if}

		{#if variant !== 'owner'}
			<fieldset class="channel">
				<legend class="label">¿Cómo prefieres que te contactemos?</legend>
				<div class="pills">
					{#each [['whatsapp', 'WhatsApp'], ['correo', 'Correo'], ['telefono', 'Teléfono']] as [val, label] (val)}
						<label class="pill">
							<input type="radio" name="preferredChannel" value={val} checked={(v.preferredChannel ?? 'whatsapp') === val} />
							<span>{label}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		<div class="row">
			<div class="field">
				<label for={id('firstName')}>Nombre *</label>
				<input
					class="input"
					id={id('firstName')}
					name="firstName"
					autocomplete="given-name"
					required
					maxlength="80"
					value={v.firstName ?? ''}
					aria-invalid={err.firstName ? 'true' : undefined}
					aria-describedby={err.firstName ? id('firstName-e') : undefined}
				/>
				{#if err.firstName}<span class="field-error" id={id('firstName-e')}>{err.firstName}</span>{/if}
			</div>
			<div class="field">
				<label for={id('lastName')}>Apellidos</label>
				<input class="input" id={id('lastName')} name="lastName" autocomplete="family-name" maxlength="80" value={v.lastName ?? ''} />
			</div>
		</div>
		<div class="row">
			<div class="field">
				<label for={id('email')}>Correo electrónico *</label>
				<input
					class="input"
					id={id('email')}
					name="email"
					type="email"
					autocomplete="email"
					required
					maxlength="160"
					value={v.email ?? ''}
					aria-invalid={err.email ? 'true' : undefined}
					aria-describedby={err.email ? id('email-e') : undefined}
				/>
				{#if err.email}<span class="field-error" id={id('email-e')}>{err.email}</span>{/if}
			</div>
			<div class="field">
				<label for={id('phone')}>Teléfono / WhatsApp</label>
				<input
					class="input"
					id={id('phone')}
					name="phone"
					type="tel"
					autocomplete="tel"
					inputmode="tel"
					placeholder="+56 9 1234 5678"
					maxlength="30"
					value={v.phone ?? ''}
					aria-invalid={err.phone ? 'true' : undefined}
					aria-describedby={err.phone ? id('phone-e') : undefined}
				/>
				{#if err.phone}<span class="field-error" id={id('phone-e')}>{err.phone}</span>{/if}
			</div>
		</div>

		{#if variant === 'full'}
			<div class="field">
				<label for={id('type')}>Motivo</label>
				<select class="select" id={id('type')} name="type">
					{#each [['general', 'Consulta general'], ['consulta_propiedad', 'Quiero comprar o arrendar'], ['quiero_vender', 'Quiero vender mi propiedad'], ['quiero_arrendar', 'Quiero arrendar mi propiedad'], ['diseno', 'Diseño de interiores']] as [val, label] (val)}
						<option value={val} selected={(v.type ?? type) === val}>{label}</option>
					{/each}
				</select>
			</div>
		{/if}
		{#if variant === 'owner'}
			<div class="field">
				<label for={id('comuna')}>Comuna o sector de la propiedad</label>
				<input class="input" id={id('comuna')} name="comuna" maxlength="80" placeholder="Ej. Maitencillo" value={v.comuna ?? ''} />
			</div>
		{/if}

		{#if variant !== 'owner'}
			<div class="field">
				<label for={id('message')}>Mensaje</label>
				<textarea class="textarea" id={id('message')} name="message" maxlength="2000" rows="4">{message}</textarea>
			</div>
		{/if}

		<label class="check">
			<input type="checkbox" name="consent" required aria-invalid={err.consent ? 'true' : undefined} />
			<span>
				Acepto que Maller&amp;M Propiedades use mis datos para responder esta consulta, según la
				<a href="/politica-de-privacidad/" target="_blank">política de privacidad</a>.
			</span>
		</label>
		{#if err.consent}<span class="field-error">{err.consent}</span>{/if}

		<Turnstile action="lead" {resetKey} />

		<button class="btn {dark ? 'btn--gold' : ''} btn--block" type="submit" disabled={submitting}>
			{submitting ? 'Enviando…' : submitLabel}
		</button>
		<p class="secure"><Icon name="shield" size={14} /> Protegido con Cloudflare Turnstile. No compartimos tus datos.</p>
	</form>
{/if}

<style>
	.lead {
		display: grid;
		gap: var(--sp-4);
	}
	.row {
		display: grid;
		gap: var(--sp-4);
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
	}
	legend {
		margin-bottom: var(--sp-2);
		font-weight: 700;
		font-size: 0.92rem;
	}
	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: var(--sp-2);
	}
	.pill {
		position: relative;
	}
	.pill input {
		position: absolute;
		opacity: 0;
		inset: 0;
	}
	.pill span {
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 0 16px;
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius-pill);
		font-weight: 700;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.15s;
		background: #fff;
		color: var(--ink);
	}
	.pill input:checked + span {
		background: var(--brand-primary);
		border-color: var(--brand-primary);
		color: #fff;
	}
	.pill input:focus-visible + span {
		outline: 3px solid var(--brand-gold);
		outline-offset: 2px;
	}
	.secure {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		font-size: var(--fs-xs);
		color: var(--ink-muted);
	}
	.dark .field :global(label),
	.dark legend {
		color: #fff;
	}
	.dark .check,
	.dark .secure {
		color: #c9d4df;
	}
	.dark .check a {
		color: var(--brand-gold-light);
	}
	.done {
		text-align: center;
		padding: var(--sp-6) var(--sp-4);
		background: var(--success-bg);
		border-radius: var(--radius-card);
	}
	.done.dark {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}
	.done.dark h3 {
		color: #fff;
	}
	.done .icon {
		display: inline-grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--success);
		color: #fff;
		margin-bottom: var(--sp-3);
	}
	.done h3 {
		font-size: 1.25rem;
	}
	.done p {
		margin: 0;
	}
</style>
