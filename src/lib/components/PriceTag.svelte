<script lang="ts">
	import { fmtPrice, fmtCLP, PERIOD_LABEL, type Currency, type PricePeriod } from '$lib/format';

	let {
		price,
		uf = null,
		size = 'md'
	}: {
		price: { amount: number; currency: Currency; period: PricePeriod; isFrom: boolean } | null;
		uf?: { value: number; date: string } | null;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const approx = $derived(price && price.currency === 'UF' && uf ? Math.round((price.amount * uf.value) / 1e5) * 1e5 : null);
</script>

{#if price}
	<div class="price price--{size}">
		{#if price.isFrom}<span class="from">Desde</span>{/if}
		<span class="amount">{fmtPrice(price.amount, price.currency)}</span>
		{#if price.period !== 'total'}<span class="period">{PERIOD_LABEL[price.period]}</span>{/if}
		{#if approx && size !== 'sm'}
			<span class="approx" title="Estimación con UF del {uf?.date ? new Date(uf.date).toLocaleDateString('es-CL') : 'día'}"
				>≈ {fmtCLP(approx)} CLP</span
			>
		{/if}
	</div>
{:else}
	<div class="price price--{size}"><span class="amount consult">Precio a consultar</span></div>
{/if}

<style>
	.price {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 2px 8px;
		font-family: var(--font-heading);
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}
	.from {
		font-size: 0.78em;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ink-muted);
	}
	.amount {
		font-weight: 800;
		letter-spacing: -0.01em;
	}
	.consult {
		font-weight: 700;
		color: var(--ink-soft);
	}
	.period {
		font-size: 0.85em;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.approx {
		flex-basis: 100%;
		font-family: var(--font-body);
		font-size: 0.85rem;
		font-weight: 400;
		color: var(--ink-muted);
	}
	.price--sm .amount {
		font-size: 1.15rem;
	}
	.price--md .amount {
		font-size: 1.4rem;
	}
	.price--lg .amount {
		font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.4rem);
	}
</style>
