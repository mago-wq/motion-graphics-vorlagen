// Werbekennzeichnung oben links, das ganze Video über sichtbar (§ 5a UWG,
// TikTok-Richtlinien für Branded Content). Gestaltet wie das Senderlogo in
// der Ecke eines alten Fernsehbilds, damit die Pflicht zum Stil gehört.
import {config} from '../config';
import {FONT, STRIPE, WIDE} from '../theme';
import {SAFE} from '../video';

export const WerbungBug: React.FC = () => (
	<div
		style={{
			position: 'absolute',
			left: SAFE.left,
			top: SAFE.top + 6,
			padding: '10px 18px 9px',
			borderRadius: 10,
			background: 'rgba(3, 10, 46, 0.62)',
			border: '2px solid rgba(255,255,255,0.55)',
			color: '#FFFFFF',
			fontFamily: FONT,
			fontWeight: 800,
			fontStyle: 'italic',
			fontStretch: WIDE,
			fontSize: 26,
			lineHeight: 1,
			letterSpacing: '0.06em',
			textTransform: 'uppercase',
		}}
	>
		{config.werbung}
		<div style={{display: 'flex', marginTop: 7, height: 4, borderRadius: 2, overflow: 'hidden'}}>
			{STRIPE.map((c) => (
				<div key={c} style={{flex: 1, background: c}} />
			))}
		</div>
	</div>
);
